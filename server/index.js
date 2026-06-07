import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import mammoth from 'mammoth';
import { createClient } from 'redis';
import { PROVIDERS, calculateCost } from '../src/services/aiProviders.js';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse, buildParserSystemPrompt } from '../src/services/promptEngine.js';

const require = createRequire(import.meta.url);
// Standard pdf-parse v1.1.1 exports the parser function directly
const pdfParse = require('pdf-parse');

dotenv.config();

// Connect to Redis if available, with a silent fallback to memory cache
let redisClient = null;
let isRedisConnected = false;

(async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            // Stop retrying to avoid spamming logs when Redis is absent
            return new Error('Redis connection failed permanently');
          }
          return 1000;
        }
      }
    });
    
    redisClient.on('error', (err) => {
      if (isRedisConnected) {
        console.warn('[Redis Error] Connection lost:', err.message);
        isRedisConnected = false;
      }
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      console.log('🔌 [Redis] Connected successfully');
    });

    await redisClient.connect();
  } catch (err) {
    console.warn('[Redis] Failed to initialize client or connect, falling back to memory cache:', err.message);
    redisClient = null;
    isRedisConnected = false;
  }
})();

/**
 * Express application instance.
 * Houses the core REST API routes and configurations for OpenResumeCraft.
 */
const app = express();

/**
 * Server listening port.
 * Defaults to port 5001 if the PORT environment variable is not defined.
 */
const PORT = process.env.PORT || 5001;

// Middlewares setup
app.use(cors());
app.use(express.json({ limit: '10mb' }));

/**
 * Simple in-memory response cache.
 * Key: Dynamic hash generated from (providerId + modelId + systemPrompt + userPrompt).
 * Value: Structured result object containing generated content, token metrics, cost, and timestamps.
 * 
 * Used to implement fast, token-efficient, and cached resume optimization.
 * Prevents redundant third-party API calls when users click "Tailor Resume" multiple times 
 * without changing the input parameters.
 * 
 * @type {Map<string, object>}
 */
const responseCache = new Map();

/**
 * Periodic cache eviction task.
 * Runs every 30 minutes to clean up memory usage. If the cache exceeds 100 elements,
 * clears all cached outputs to ensure the Node.js server preserves a low RAM footprint.
 */
setInterval(() => {
  if (responseCache.size > 100) {
    responseCache.clear();
    console.log('[Server Cache] Cleared to free memory');
  }
}, 30 * 60 * 1000); // 30 minutes

/**
 * GET /api/health
 * ---------------
 * Lightweight endpoint to check the running state of the backend server.
 * Used for deployment health probes and initial application startup sanity checks.
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'OpenResumeCraft backend is running successfully' });
});

/**
 * GET /api/providers
 * ------------------
 * Returns the registry of all configured third-party AI providers (OpenAI, Gemini, Anthropic, etc.)
 * along with their model list metadata, HSL branding colors, and pricing parameters.
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {void}
 */
app.get('/api/providers', (req, res) => {
  res.json(PROVIDERS);
});

/**
 * GET /api/ollama-models
 * ----------------------
 * Attempts to dynamically fetch the lists of installed local models from the Ollama service
 * if running on the user's host machine (http://localhost:11434).
 * 
 * Includes a 2-second fast connection timeout to prevent hanging the React UI when
 * Ollama is offline or not installed, gracefully falling back to a 503 service status.
 *
 * @param {express.Request} req - Express request object.
 * @param {express.Response} res - Express response object.
 * @returns {Promise<void>}
 */
app.get('/api/ollama-models', async (req, res) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout is plenty for a local server connection
  
  try {
    const response = await fetch('http://localhost:11434/api/tags', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Ollama tags response not ok: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Format Ollama local model specifications to match standard provider models schema
    const formattedModels = (data.models || []).map(m => {
      const paramSize = m.details?.parameter_size ? ` (${m.details.parameter_size})` : '';
      const quant = m.details?.quantization_level ? ` [${m.details.quantization_level}]` : '';
      return {
        id: m.name,
        name: m.name,
        inputPrice: 0.00,
        outputPrice: 0.00,
        description: `Local Model${paramSize}${quant}`,
        isDynamic: true
      };
    });
    res.json(formattedModels);
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn(`[Ollama Fetch Warning] Offline or not running locally:`, error.message);
    res.status(503).json({ error: 'Ollama is offline or not running locally.', details: error.message });
  }
});


/**
 * POST /api/generate
 * ------------------
 * Unified server-side endpoint to tailor resume JSON content against a target job description.
 *
 * Implements a lightweight reverse-proxy calling third-party LLMs (OpenAI, Gemini, Anthropic, etc.).
 * Includes key features:
 *   1. System-level fallback for API keys stored in environment variables (e.g., OPENAI_API_KEY).
 *   2. In-memory caching logic based on hashed parameters to conserve token usage.
 *   3. Provider-specific API payload converters.
 *   4. Client disconnect tracking and abort thresholds (Ollama local timeout at 3 minutes, external APIs at 60 seconds).
 *
 * @param {express.Request} req - Express request object containing:
 *   - providerId {string}: AI Provider ID ('openai', 'gemini', 'anthropic', etc.)
 *   - modelId {string}: Specific model identifier (e.g., 'gpt-4o-mini')
 *   - apiKey {string}: Client-provided API key (optional fallback to env variables)
 *   - systemPrompt {string}: Custom system instruction set
 *   - userPrompt {string}: Rendered XML layout of user resume + job description
 *   - useCache {boolean}: Toggle to force refresh or use memory cache (default: true)
 * @param {express.Response} res - Express response object returning structured tailored resume + token costs.
 * @returns {Promise<void>}
 */
app.post('/api/generate', async (req, res) => {
  const { providerId, modelId, apiKey, systemPrompt, userPrompt, useCache = true } = req.body;

  // Fallback to server environment keys if client API keys are blank
  let activeKey = apiKey ? apiKey.trim() : '';
  if (!activeKey && providerId !== 'ollama') {
    const envKeyName = `${providerId.toUpperCase()}_API_KEY`;
    activeKey = process.env[envKeyName] || '';
  }

  if (!providerId || !modelId || (providerId !== 'ollama' && !activeKey)) {
    return res.status(400).json({ error: `Missing required parameter: API Key is required for ${providerId}` });
  }

  // Create a unique cache key to intercept redundant requests
  const cacheKey = `${providerId}:${modelId}:${systemPrompt}:${userPrompt}`;

  // 1. Check Redis cache first if connected
  if (useCache && isRedisConnected && redisClient) {
    try {
      const cachedVal = await redisClient.get(cacheKey);
      if (cachedVal) {
        console.log(`[Redis Cache] Hit for ${providerId}:${modelId}`);
        const parsedCached = JSON.parse(cachedVal);
        return res.json({ ...parsedCached, cached: true });
      }
    } catch (redisErr) {
      console.warn('[Redis Cache Get Error] Fallback to memory cache:', redisErr.message);
    }
  }

  // 2. Fallback to memory cache
  if (useCache && responseCache.has(cacheKey)) {
    console.log(`[Server Cache] Hit (Memory) for ${providerId}:${modelId}`);
    const cachedResponse = responseCache.get(cacheKey);
    return res.json({ ...cachedResponse, cached: true });
  }

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }

  let model = provider.models.find(m => m.id === modelId);
  if (!model && providerId === 'ollama') {
    model = { id: modelId, name: modelId, inputPrice: 0.00, outputPrice: 0.00, description: 'Dynamic Local Model' };
  } else if (!model) {
    return res.status(400).json({ error: `Unknown model: ${modelId} for provider ${provider.name}` });
  }

  try {
    console.log(`[Server] Requesting generation from ${provider.name} (${modelId})...`);
    let url, headers, body;

    switch (provider.format) {
      case 'openai':
        url = provider.baseUrl;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey || 'ollama'}`,
        };
        body = {
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4096
        };
        break;

      case 'gemini':
        url = `${provider.baseUrl}/${modelId}:generateContent?key=${activeKey}`;
        headers = {
          'Content-Type': 'application/json'
        };
        body = {
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
          }
        };
        break;

      case 'anthropic':
        url = provider.baseUrl;
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': activeKey,
          'anthropic-version': '2023-06-01'
        };
        body = {
          model: modelId,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt }
          ]
        };
        break;

      default:
        return res.status(400).json({ error: `Unsupported format: ${provider.format}` });
    }

    const startTime = Date.now();
    const timeoutMs = providerId === 'ollama' ? 180000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Server Timeout] AI request timed out for ${provider.name} after ${timeoutMs / 1000}s. Aborting.`);
      controller.abort();
    }, timeoutMs);

    console.log(`[Server] Connecting to ${provider.name} API endpoint...`);
    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`Request to ${provider.name} timed out after ${timeoutMs / 1000} seconds. Local models can sometimes take longer to load or generate. Please verify Ollama is responding or try a lighter model.`);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    console.log(`[Server] Received response from ${provider.name} API (Status: ${response.status})`);

    if (!response.ok) {
      let errorMessage = `${provider.name} API error (${response.status})`;
      try {
        const errorData = await response.json();
        const detail = errorData.error?.message || errorData.message || errorData.error?.type || JSON.stringify(errorData);
        errorMessage += `: ${detail}`;
      } catch {
        errorMessage += `: ${response.statusText}`;
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    console.log(`[Server] Parsing response payload...`);

    const data = await response.json();
    let content = '';
    let tokens = { input: 0, output: 0, total: 0 };

    switch (provider.format) {
      case 'openai':
        content = data.choices?.[0]?.message?.content || '';
        tokens = {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0
        };
        break;

      case 'gemini':
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        tokens = {
          input: data.usageMetadata?.promptTokenCount || 0,
          output: data.usageMetadata?.candidatesTokenCount || 0,
          total: data.usageMetadata?.totalTokenCount || 0
        };
        break;

      case 'anthropic':
        content = data.content?.[0]?.text || '';
        tokens = {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        };
        break;
    }

    const duration = Date.now() - startTime;
    const cost = calculateCost(providerId, modelId, tokens.input, tokens.output);

    const result = {
      content,
      tokens,
      cost,
      model: model.name,
      provider: provider.name,
      modelId,
      providerId,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    // Store in cache
    if (useCache && content) {
      responseCache.set(cacheKey, result);

      // Store in Redis if available
      if (isRedisConnected && redisClient) {
        try {
          // TTL of 24 hours (86400 seconds)
          await redisClient.set(cacheKey, JSON.stringify(result), {
            EX: 86400
          });
          console.log(`[Redis Cache] Set successful for ${providerId}:${modelId}`);
        } catch (redisErr) {
          console.warn('[Redis Cache Set Error]:', redisErr.message);
        }
      }
    }

    res.json(result);
  } catch (error) {
    console.error(`[Server Error] Calling AI provider:`, error);
    res.status(500).json({ error: `Backend Server Error: ${error.message}` });
  }
});

/**
 * POST /api/parse-resume
 * ----------------------
 * Parses unformatted, raw resume text into structured JSON matching the OpenResumeCraft schema.
 * Useful for bootstrapping new users from existing documents or LinkedIn copy-pastes.
 * 
 * Works similarly to /api/generate but enforces:
 *   1. A parser-specific, high-fidelity system extraction instruction sheet.
 *   2. Forced low temperature (0.2) to prevent creative hallucination of historical details.
 *   3. Dynamic model selection & timeout strategies.
 *
 * @param {express.Request} req - Express request object containing:
 *   - providerId {string}: AI Provider ID ('openai', 'gemini', 'anthropic', etc.)
 *   - modelId {string}: Specific model identifier (e.g., 'gpt-4o-mini')
 *   - apiKey {string}: API Key credential
 *   - rawText {string}: Unstructured plain-text string extracted from PDF, Word, or text source
 * @param {express.Response} res - Express response object returning structured schema-compatible JSON.
 * @returns {Promise<void>}
 */
app.post('/api/parse-resume', async (req, res) => {
  const { providerId, modelId, apiKey, rawText } = req.body;

  // Key fallback
  let activeKey = apiKey ? apiKey.trim() : '';
  if (!activeKey && providerId !== 'ollama') {
    const envKeyName = `${providerId.toUpperCase()}_API_KEY`;
    activeKey = process.env[envKeyName] || '';
  }

  if (!providerId || !modelId || (providerId !== 'ollama' && !activeKey) || !rawText) {
    return res.status(400).json({ error: 'Missing required parameters: providerId, modelId, activeKey, rawText' });
  }

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }

  let model = provider.models.find(m => m.id === modelId);
  if (!model && providerId === 'ollama') {
    model = { id: modelId, name: modelId, inputPrice: 0.00, outputPrice: 0.00, description: 'Dynamic Local Model' };
  } else if (!model) {
    return res.status(400).json({ error: `Unknown model: ${modelId} for provider ${provider.name}` });
  }

  const systemPrompt = buildParserSystemPrompt();

  try {
    console.log(`[Server] Parsing resume using ${provider.name} (${modelId})...`);
    let url, headers, body;

    switch (provider.format) {
      case 'openai':
        url = provider.baseUrl;
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeKey || 'ollama'}`,
        };
        body = {
          model: modelId,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: rawText }
          ],
          temperature: 0.2, // Low temperature for high-fidelity extraction
          max_tokens: 4096
        };
        break;

      case 'gemini':
        url = `${provider.baseUrl}/${modelId}:generateContent?key=${activeKey}`;
        headers = {
          'Content-Type': 'application/json'
        };
        body = {
          contents: [
            {
              role: 'user',
              parts: [{ text: rawText }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096
          }
        };
        break;

      case 'anthropic':
        url = provider.baseUrl;
        headers = {
          'Content-Type': 'application/json',
          'x-api-key': activeKey,
          'anthropic-version': '2023-06-01'
        };
        body = {
          model: modelId,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [
            { role: 'user', content: rawText }
          ],
          temperature: 0.2
        };
        break;

      default:
        return res.status(400).json({ error: `Unsupported format: ${provider.format}` });
    }

    const startTime = Date.now();
    const timeoutMs = providerId === 'ollama' ? 180000 : 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[Server Timeout] AI parsing timed out for ${provider.name} after ${timeoutMs / 1000}s. Aborting.`);
      controller.abort();
    }, timeoutMs);

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error(`AI parser request timed out after ${timeoutMs / 1000} seconds. Local models can sometimes take longer to load or generate.`);
      }
      throw fetchError;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      let errorMessage = `${provider.name} API error (${response.status})`;
      try {
        const errorData = await response.json();
        const detail = errorData.error?.message || errorData.message || errorData.error?.type || JSON.stringify(errorData);
        errorMessage += `: ${detail}`;
      } catch {
        errorMessage += `: ${response.statusText}`;
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    const data = await response.json();
    let content = '';
    let tokens = { input: 0, output: 0, total: 0 };

    switch (provider.format) {
      case 'openai':
        content = data.choices?.[0]?.message?.content || '';
        tokens = {
          input: data.usage?.prompt_tokens || 0,
          output: data.usage?.completion_tokens || 0,
          total: data.usage?.total_tokens || 0
        };
        break;

      case 'gemini':
        content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        tokens = {
          input: data.usageMetadata?.promptTokenCount || 0,
          output: data.usageMetadata?.candidatesTokenCount || 0,
          total: data.usageMetadata?.totalTokenCount || 0
        };
        break;

      case 'anthropic':
        content = data.content?.[0]?.text || '';
        tokens = {
          input: data.usage?.input_tokens || 0,
          output: data.usage?.output_tokens || 0,
          total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        };
        break;
    }

    const duration = Date.now() - startTime;
    const cost = calculateCost(providerId, modelId, tokens.input, tokens.output);

    const result = {
      content,
      tokens,
      cost,
      model: model.name,
      provider: provider.name,
      modelId,
      providerId,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    res.json(result);
  } catch (error) {
    console.error(`[Server Error] Parsing resume:`, error);
    res.status(500).json({ error: `Backend Server Error: ${error.message}` });
  }
});

/**
 * Raw binary body parser middleware.
 * Maps binary buffer streams sent to /api/extract-text directly into `req.body`
 * up to a 10MB payload size. Required since file extraction routes receive
 * raw document binaries directly instead of standard JSON.
 */
app.use('/api/extract-text', express.raw({ type: '*/*', limit: '10mb' }));

/**
 * POST /api/extract-text
 * ----------------------
 * Parses a binary file stream uploaded from the front-end and extracts raw, unstructured text.
 * Support matrix:
 *   - 'application/pdf' or file name ending in `.pdf`: Processed using `pdf-parse` library.
 *   - 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' or ending in `.docx`: Processed using `mammoth` library (extracts raw paragraphs, omitting complex visual styling).
 *   - Any other format: Read as plain-text UTF-8 buffer.
 *
 * @param {express.Request} req - Express request object containing:
 *   - headers['content-type'] {string}: The MIME type of the uploaded file
 *   - headers['x-file-name'] {string}: The original file name with extension
 *   - body {Buffer}: Raw file binary buffer
 * @param {express.Response} res - Express response object returning the extracted plain-text string.
 * @returns {Promise<void>}
 */
app.post('/api/extract-text', async (req, res) => {
  const contentType = req.headers['content-type'] || '';
  const fileName = req.headers['x-file-name'] || 'document';

  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ error: 'No binary file data received in the request body.' });
  }

  try {
    let extractedText = '';

    if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) {
      console.log(`[Server] Parsing PDF document: ${fileName} (${req.body.length} bytes)...`);
      const parsed = await pdfParse(req.body);
      extractedText = parsed.text || '';
    } else if (
      contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
      fileName.endsWith('.docx')
    ) {
      console.log(`[Server] Parsing DOCX Word document: ${fileName} (${req.body.length} bytes)...`);
      const result = await mammoth.extractRawText({ buffer: req.body });
      extractedText = result.value || '';
    } else {
      // Fallback: treat as plain text if it's not PDF or Word
      console.log(`[Server] Parsing plain text file: ${fileName} (${req.body.length} bytes)...`);
      extractedText = req.body.toString('utf-8');
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Failed to extract any text from the uploaded document. Please ensure it is not password-protected or empty.' });
    }

    console.log(`[Server] Successfully extracted ${extractedText.length} characters from ${fileName}`);
    res.json({ text: extractedText });

  } catch (err) {
    console.error('[Server Error] File text extraction failed:', err);
    res.status(500).json({ error: `Failed to read document: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 OpenResumeCraft Server running on port ${PORT}`);
});
