/**
 * OpenResumeCraft — AI Provider Engine
 * Unified interface for multiple AI providers with token tracking and cost calculation.
 */

// ─── Provider Registry ───────────────────────────────────────────────
export const PROVIDERS = {
  ollama: {
    name: 'Ollama (Local)',
    baseUrl: 'http://localhost:11434/v1/chat/completions',
    models: [
      { id: 'llama3', name: 'Llama 3 (8B)', inputPrice: 0.00, outputPrice: 0.00, description: 'Default Llama 3' },
      { id: 'mistral', name: 'Mistral (7B)', inputPrice: 0.00, outputPrice: 0.00, description: 'Dense reasoning' },
      { id: 'gemma:7b', name: 'Gemma (7B)', inputPrice: 0.00, outputPrice: 0.00, description: 'Google Local' },
      { id: 'phi3', name: 'Phi 3 (3.8B)', inputPrice: 0.00, outputPrice: 0.00, description: 'Lightweight & fast' },
    ],
    format: 'openai',
    color: '#34495e',
    icon: '🦙',
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', inputPrice: 2.50, outputPrice: 10.00, description: 'Most capable' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.60, description: 'Best value' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', inputPrice: 0.10, outputPrice: 0.40, description: 'Ultra cheap' },
    ],
    format: 'openai',
    color: '#10a37f',
    icon: '⚡',
  },
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', inputPrice: 0.10, outputPrice: 0.40, description: 'Fast & cheap' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', inputPrice: 0.15, outputPrice: 0.60, description: 'Latest flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', inputPrice: 1.25, outputPrice: 5.00, description: 'High quality' },
    ],
    format: 'gemini',
    color: '#4285f4',
    icon: '✨',
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: [
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', inputPrice: 3.00, outputPrice: 15.00, description: 'Best reasoning' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', inputPrice: 0.80, outputPrice: 4.00, description: 'Fast & capable' },
    ],
    format: 'anthropic',
    color: '#d4a574',
    icon: '🧠',
    corsWarning: true,
    corsNote: 'Anthropic may require a CORS proxy for browser-side calls. Use a proxy or backend relay if you encounter CORS errors.',
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', inputPrice: 0.59, outputPrice: 0.79, description: 'Best quality' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', inputPrice: 0.05, outputPrice: 0.08, description: 'Ultra fast' },
      { id: 'gemma2-9b-it', name: 'Gemma2 9B', inputPrice: 0.20, outputPrice: 0.20, description: 'Balanced' },
    ],
    format: 'openai',
    color: '#f55036',
    icon: '🚀',
  },
  deepseek: {
    name: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', inputPrice: 0.27, outputPrice: 1.10, description: 'Great value' },
      { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', inputPrice: 0.55, outputPrice: 2.19, description: 'Deep reasoning' },
    ],
    format: 'openai',
    color: '#5b6cf0',
    icon: '🔮',
  },
};

/**
 * Returns the entire static registry of third-party and local AI providers.
 *
 * @returns {object} The full PROVIDERS config object map.
 */
export function getProviders() {
  return PROVIDERS;
}

/**
 * Retrieves the configuration metadata of a specific AI provider.
 *
 * @param {string} providerId - The provider's key (e.g., 'openai', 'gemini').
 * @returns {object|null} The provider configuration object, or null if not found.
 */
export function getProvider(providerId) {
  return PROVIDERS[providerId] || null;
}

/**
 * Returns all configured active models associated with a specific provider.
 *
 * @param {string} providerId - The provider's key (e.g., 'anthropic', 'deepseek').
 * @returns {Array<object>} List of model configuration objects (containing pricing and features).
 */
export function getModels(providerId) {
  const provider = PROVIDERS[providerId];
  return provider ? provider.models : [];
}

/**
 * Retrieves the specifications for a given model under a specific provider.
 * Handles dynamic model creation for the local 'ollama' provider to support custom client models.
 *
 * @param {string} providerId - Provider identifier (e.g., 'openai').
 * @param {string} modelId - Model identifier (e.g., 'gpt-4o-mini').
 * @returns {object|null} The model definition containing descriptions and prices, or null.
 */
export function getModel(providerId, modelId) {
  const models = getModels(providerId);
  const found = models.find(m => m.id === modelId);
  if (!found && providerId === 'ollama') {
    return { id: modelId, name: modelId, inputPrice: 0.00, outputPrice: 0.00, description: 'Dynamic Local Model' };
  }
  return found || null;
}

/**
 * Calculates the exact token transaction cost in USD based on input and output token counts.
 * Uses provider-specific model pricing parameters (quoted per 1,000,000 tokens).
 *
 * @param {string} providerId - The provider identifier.
 * @param {string} modelId - The model identifier.
 * @param {number} inputTokens - Prompt token count.
 * @param {number} outputTokens - Completion token count.
 * @returns {number} The calculated transaction cost in USD (floating point).
 */
export function calculateCost(providerId, modelId, inputTokens, outputTokens) {
  const model = getModel(providerId, modelId);
  if (!model) return 0;
  const inputCost = (inputTokens / 1_000_000) * model.inputPrice;
  const outputCost = (outputTokens / 1_000_000) * model.outputPrice;
  return inputCost + outputCost;
}

/**
 * Formats a USD floating point cost into a beautiful, human-readable string representation.
 * Dynamically adjusts decimal precision depending on the cost magnitude.
 *
 * @param {number} cost - The numerical transaction cost in USD.
 * @returns {string} The formatted currency string (e.g., '$0.0024' or '$1.50').
 */
export function formatCost(cost) {
  if (cost < 0.001) return `$${cost.toFixed(6)}`;
  if (cost < 0.01) return `$${cost.toFixed(5)}`;
  if (cost < 1) return `$${cost.toFixed(4)}`;
  return `$${cost.toFixed(3)}`;
}

/**
 * Formats a raw integer token count with thousands-separator commas.
 *
 * @param {number} count - The raw number of tokens.
 * @returns {string} The formatted locale string (e.g., "15,230").
 */
export function formatTokens(count) {
  return count.toLocaleString('en-US');
}

// ─── Request Builders ─────────────────────────────────────────────────

function buildOpenAIRequest(model, systemPrompt, userPrompt) {
  return {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  };
}

function buildGeminiRequest(systemPrompt, userPrompt) {
  return {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4096,
    },
  };
}

function buildAnthropicRequest(model, systemPrompt, userPrompt) {
  return {
    model: model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt },
    ],
  };
}

// ─── Response Parsers ─────────────────────────────────────────────────

function parseOpenAIResponse(data) {
  const content = data.choices?.[0]?.message?.content || '';
  const usage = data.usage || {};
  return {
    content,
    tokens: {
      input: usage.prompt_tokens || 0,
      output: usage.completion_tokens || 0,
      total: usage.total_tokens || (usage.prompt_tokens || 0) + (usage.completion_tokens || 0),
    },
  };
}

function parseGeminiResponse(data) {
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const usage = data.usageMetadata || {};
  return {
    content,
    tokens: {
      input: usage.promptTokenCount || 0,
      output: usage.candidatesTokenCount || 0,
      total: usage.totalTokenCount || (usage.promptTokenCount || 0) + (usage.candidatesTokenCount || 0),
    },
  };
}

function parseAnthropicResponse(data) {
  const content = data.content?.[0]?.text || '';
  const usage = data.usage || {};
  return {
    content,
    tokens: {
      input: usage.input_tokens || 0,
      output: usage.output_tokens || 0,
      total: (usage.input_tokens || 0) + (usage.output_tokens || 0),
    },
  };
}

// ─── Main Generate Function ───────────────────────────────────────────

/**
 * Generate resume content using the specified AI provider.
 * @param {string} providerId - Provider key (e.g., 'openai', 'gemini')
 * @param {string} modelId - Model ID (e.g., 'gpt-4o-mini')
 * @param {string} apiKey - User's API key for the provider
 * @param {string} systemPrompt - System instructions
 * @param {string} userPrompt - User prompt with resume data and JD
 * @returns {Promise<{content: string, tokens: {input: number, output: number, total: number}, cost: number, model: string, provider: string}>}
 */
export async function generateResume(providerId, modelId, apiKey, systemPrompt, userPrompt) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }

  let model = provider.models.find(m => m.id === modelId);
  if (!model && providerId === 'ollama') {
    model = { id: modelId, name: modelId, inputPrice: 0.00, outputPrice: 0.00, description: 'Dynamic Local Model' };
  } else if (!model) {
    throw new Error(`Unknown model: ${modelId} for provider ${provider.name}`);
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error(`API key is required for ${provider.name}`);
  }

  let url, headers, body;

  switch (provider.format) {
    case 'openai':
      url = provider.baseUrl;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey.trim()}`,
      };
      body = buildOpenAIRequest(modelId, systemPrompt, userPrompt);
      break;

    case 'gemini':
      url = `${provider.baseUrl}/${modelId}:generateContent?key=${apiKey.trim()}`;
      headers = {
        'Content-Type': 'application/json',
      };
      body = buildGeminiRequest(systemPrompt, userPrompt);
      break;

    case 'anthropic':
      url = provider.baseUrl;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
      body = buildAnthropicRequest(modelId, systemPrompt, userPrompt);
      break;

    default:
      throw new Error(`Unsupported format: ${provider.format}`);
  }

  // Make the API call
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (networkError) {
    if (provider.corsWarning) {
      throw new Error(
        `Network error calling ${provider.name}. This may be a CORS issue. ${provider.corsNote || 'Try using a CORS proxy.'}`
      );
    }
    throw new Error(`Network error calling ${provider.name}: ${networkError.message}`);
  }

  // Handle HTTP errors
  if (!response.ok) {
    let errorMessage = `${provider.name} API error (${response.status})`;
    try {
      const errorData = await response.json();
      const detail = errorData.error?.message || errorData.message || errorData.error?.type || JSON.stringify(errorData);
      errorMessage += `: ${detail}`;
    } catch {
      errorMessage += `: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  // Parse response
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Failed to parse ${provider.name} response as JSON`);
  }

  // Extract content and tokens
  let result;
  switch (provider.format) {
    case 'openai':
      result = parseOpenAIResponse(data);
      break;
    case 'gemini':
      result = parseGeminiResponse(data);
      break;
    case 'anthropic':
      result = parseAnthropicResponse(data);
      break;
    default:
      throw new Error(`Unsupported response format: ${provider.format}`);
  }

  if (!result.content) {
    throw new Error(`${provider.name} returned an empty response. The model may have refused the request.`);
  }

  // Calculate cost
  const cost = calculateCost(providerId, modelId, result.tokens.input, result.tokens.output);

  return {
    content: result.content,
    tokens: result.tokens,
    cost,
    model: model.name,
    provider: provider.name,
    modelId,
    providerId,
    timestamp: new Date().toISOString(),
  };
}
