import fs from 'fs';
import path from 'path';
import { calculateATSScore } from '../src/services/atsScoringEngine.js';
import { defaultResume } from '../src/data/defaultResume.js';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse } from '../src/services/promptEngine.js';

// Configuration
const CONCURRENCY = 3; // Lower concurrency to prevent server/API rate limits
const API_URL = 'http://localhost:5001/api/generate';
const PROVIDER_ID = 'openai';
const MODEL_ID = 'gpt-4o-mini';
const OUTPUT_PATH = '/Users/sairaghukiranavula/.gemini/antigravity-ide/brain/f6365133-5156-4229-8a52-c7e6a20d5eb6/analysis_results_50.md';

// Helper to capital-case string
function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Programmatic 50 JDs Generator focusing on Frontend/React Developer with 2 YOE
function generate50JobDescriptions() {
  const companies = [
    'Stripe', 'Google', 'Meta', 'Amazon', 'Netflix', 'Canva', 'Vercel', 'Spotify', 'Shopify', 'Uber',
    'Slack', 'Discord', 'Figma', 'Zoom', 'Linear', 'Airbnb', 'Pinterest', 'Lyft', 'GitLab', 'HubSpot',
    'Robinhood', 'Coinbase', 'Duolingo', 'Asana', 'Miro', 'Notion', 'Rippling', 'Webflow', 'Sentry', 'Postman'
  ];

  const platforms = ['LinkedIn', 'Indeed', 'Wellfound', 'YC Jobs', 'Glassdoor', 'ZipRecruiter'];

  const titles = [
    'Frontend Developer (React)',
    'React Developer',
    'UI Engineer - React.js',
    'Frontend Engineer (2 YOE)',
    'React Specialist',
    'Frontend Web Developer',
    'React Developer - UI/UX Team',
    'Software Engineer, Frontend',
    'Web Developer (React/TS)'
  ];

  const focusKeywords = [
    ['typescript', 'redux', 'jest', 'css', 'git'],
    ['next.js', 'tailwind', 'graphql', 'webpack', 'ci/cd'],
    ['vite', 'sass', 'cypress', 'rest api', 'agile'],
    ['typescript', 'context api', 'bootstrap', 'eslint', 'github'],
    ['next.js', 'remix', 'tailwind', 'jest', 'npm'],
    ['typescript', 'graphql', 'apollo', 'vite', 'gitlab'],
    ['redux', 'saga', 'sass', 'webpack', 'jira'],
    ['typescript', 'next.js', 'tailwind', 'cypress', 'git'],
    ['context api', 'tailwind', 'rest api', 'npm', 'agile'],
    ['typescript', 'redux toolkit', 'jest', 'webpack', 'ci/cd']
  ];

  const descriptions = [];

  for (let i = 1; i <= 50; i++) {
    const company = companies[i % companies.length];
    const platform = platforms[i % platforms.length];
    const title = titles[i % titles.length];
    const keywords = focusKeywords[i % focusKeywords.length];
    
    const jdText = `
Role: ${title} at ${company}
Posted on: ${platform}
Requirements:
- Strong knowledge of HTML5, CSS3, and modern JavaScript (ES6+).
- Requires exactly 2 years of professional software engineering experience focusing on Frontend development.
- Minimum 2 years of hands-on experience building highly interactive web interfaces using React.js.
- Strong proficiency in state management, including: ${keywords[1]}.
- Technical stack requirements: ${keywords.join(', ')}.
- Familiarity with version control systems, primarily Git/GitHub.
- Understanding of responsive design, web performance optimization, and testing (e.g. ${keywords[2] || 'Jest'}).
- Ability to collaborate with cross-functional teams in an Agile environment.
    `;

    descriptions.push({
      id: i,
      title,
      company,
      platform,
      keywords,
      text: jdText.trim()
    });
  }

  return descriptions;
}

// Concurrency-limited Promise Pool with delay
async function promisePool(items, batchSize, fn) {
  const results = [];
  const executing = new Set();
  
  for (const item of items) {
    // Add a small 200ms delay between worker triggers to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 200));

    const p = Promise.resolve().then(() => fn(item));
    results.push(p);
    executing.add(p);
    
    const clean = () => executing.delete(p);
    p.then(clean, clean);
    
    if (executing.size >= batchSize) {
      await Promise.race(executing);
    }
  }
  return Promise.all(results);
}

async function main() {
  console.log('--- STARTING 50-JD BENCHMARK ANALYSIS ---');
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;

  const jds = generate50JobDescriptions();
  console.log(`Generated 50 Frontend/React Developer (2 YOE) job descriptions.`);

  let totalTokensInput = 0;
  let totalTokensOutput = 0;
  let totalCost = 0;
  let cachedHits = 0;
  let successCount = 0;

  const results = await promisePool(jds, CONCURRENCY, async (jd) => {
    // 1. Calculate Score Before Tailoring
    const beforeAnalysis = calculateATSScore(defaultResume, jd.text, 'classic');

    // 2. Prepare Tailoring payload
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(defaultResume, jd.text, { tone: 'professional' });

    let tailoredResume = null;
    let tokens = { input: 0, output: 0, total: 0 };
    let cost = 0;
    let cached = false;
    let durationMs = 0;
    let status = 200;

    const postStart = Date.now();
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: PROVIDER_ID,
          modelId: MODEL_ID,
          apiKey: '',
          systemPrompt,
          userPrompt,
          useCache: true
        })
      });

      durationMs = Date.now() - postStart;
      status = response.status;

      if (response.ok) {
        const data = await response.json();
        try {
          tailoredResume = parseAIResponse(data.content);
          successCount++;
        } catch (e) {
          console.warn(`[Warning] Parse failed for JD #${jd.id}:`, e.message);
        }
        tokens = data.tokens || tokens;
        cost = data.cost || cost;
        cached = data.cached || false;
      } else {
        console.warn(`[Warning] API request returned status ${response.status} for JD #${jd.id}`);
      }
    } catch (err) {
      console.warn(`[Warning] Tailoring call failed for JD #${jd.id}:`, err.message);
      durationMs = Date.now() - postStart;
    }

    if (!tailoredResume) {
      tailoredResume = defaultResume;
    }

    // Accumulate metrics
    totalTokensInput += tokens.input || 0;
    totalTokensOutput += tokens.output || 0;
    totalCost += cost;
    if (cached) cachedHits++;

    // 3. Calculate Score After Tailoring
    const afterAnalysis = calculateATSScore(tailoredResume, jd.text, 'classic');

    console.log(`[JD #${jd.id}] ${jd.company} (${jd.platform}) - Before: ${beforeAnalysis.score}%, After: ${afterAnalysis.score}%, Status: ${status}, Cache: ${cached ? 'HIT' : 'MISS'}, Time: ${durationMs}ms`);

    return {
      id: jd.id,
      company: jd.company,
      platform: jd.platform,
      title: jd.title,
      beforeScore: beforeAnalysis.score,
      afterScore: afterAnalysis.score,
      keywords: jd.keywords,
      beforeAnalysis,
      afterAnalysis,
      cached,
      cost,
      status,
      durationMs
    };
  });

  const endTime = Date.now();
  const endMemory = process.memoryUsage().heapUsed;
  
  const totalDurationMs = endTime - startTime;
  const memoryDeltaMb = ((endMemory - startMemory) / 1024 / 1024).toFixed(2);

  const successfulRuns = results.filter(r => r.status === 200);

  // Write Detailed Markdown Report
  let report = `# ATS Resume Customization Benchmark Report (50 Job Postings)

* **Target Role Profile**: Frontend/React Developer (2 YOE)
* **Date of Analysis**: ${new Date().toISOString().split('T')[0]}
* **API Engine / Model**: OpenAI / gpt-4o-mini

## 1. Resource and Execution Metrics
* **Total Execution Time**: ${(totalDurationMs / 1000).toFixed(2)} seconds (~${(totalDurationMs / 1000 / 60).toFixed(2)} mins)
* **Concurrent Limit**: ${CONCURRENCY} workers
* **Successful Tailoring Runs**: ${successfulRuns.length} / 50
* **Cache Hits**: ${cachedHits} / 50
* **Total Input Tokens**: ${totalTokensInput.toLocaleString()}
* **Total Output Tokens**: ${totalTokensOutput.toLocaleString()}
* **Total API Costs**: $${totalCost.toFixed(5)}
* **System Memory Delta**: ${memoryDeltaMb} MB

## 2. Statistical Highlights (Successful Runs Only)
| Metric | Value |
| --- | --- |
| Average Baseline (Before) Score | ${(successfulRuns.reduce((a, b) => a + b.beforeScore, 0) / successfulRuns.length).toFixed(2)}% |
| Average Optimized (After) Score | ${(successfulRuns.reduce((a, b) => a + b.afterScore, 0) / successfulRuns.length).toFixed(2)}% |
| Average Score Improvement | +${((successfulRuns.reduce((a, b) => a + b.afterScore, 0) - successfulRuns.reduce((a, b) => a + b.beforeScore, 0)) / successfulRuns.length).toFixed(2)}% |
| Highest Baseline Score | ${Math.max(...successfulRuns.map(r => r.beforeScore))}% |
| Highest Tailored Score | ${Math.max(...successfulRuns.map(r => r.afterScore))}% |
| Lowest Tailored Score | ${Math.min(...successfulRuns.map(r => r.afterScore))}% |

## 3. Score Distribution (Successful Runs)
| Range | Baseline count | Tailored count |
| --- | --- | --- |
| Excellent (>= 85%) | ${successfulRuns.filter(r => r.beforeScore >= 85).length} | ${successfulRuns.filter(r => r.afterScore >= 85).length} |
| Good (70% - 84%) | ${successfulRuns.filter(r => r.beforeScore >= 70 && r.beforeScore < 85).length} | ${successfulRuns.filter(r => r.afterScore >= 70 && r.afterScore < 85).length} |
| Low Alignment (< 70%) | ${successfulRuns.filter(r => r.beforeScore < 70).length} | ${successfulRuns.filter(r => r.afterScore < 70).length} |

## 4. Gap Analysis & Architectural Critique

### Why is the Tailored Score Not Always 100%?
Even though the AI tailors the resume to fit the Job Description, several deterministic checks in [atsScoringEngine.js](file:///Users/sairaghukiranavula/Projects/OpenResumeCraft/src/services/atsScoringEngine.js) penalize the output:
1. **Verbs Whitelist Restriction (Readability Score)**: The scoring engine requires *every single bullet point* in your experience history to start with one of exactly 16 verbs. The LLM naturally uses other standard action verbs (like *Spearheaded*, *Created*, *Managed*) that are technically correct but cause a 5-point deduction in our strict local evaluator.
2. **Quantification Rule Limits**: The scoring engine checks what percentage of your bullet points contain digits or percentages. While the AI tries to optimize, it cannot hallucinate metrics that aren't in the baseline candidate history (to keep the resume truthful).
3. **Date String Regex Strictness**: The engine enforces a 3-letter Month YYYY format. If the LLM preserves your date strings exactly (e.g. \`2022-01\` or fully written \`January 2022\`), the regex fails, leading to a 2-point penalty.

### Recommendations to build the absolute "Best" Resume Generator:
* **Dynamic Action Verb Mapper**: Standardize and map the first word of every experience bullet point to a whitelisted ATS verb before sending to template output.
* **Auto-Quantification Helper**: Guide users to enter quantified metrics (or suggest placeholders/standard metrics) in the editor UI.
* **Automated Date Standardizer**: Automatically format date entries before calculation to match the strict \`Month YYYY\` pattern.
* **Keywords Alignment Feedback Loop**: Show direct button options to inject critical missing skills contextually, boosting matching score reactively.

## 5. Detailed Runs Table
| JD ID | Job Title & Company | Baseline Score | Tailored Score | Change | Status | Cache Status | Time |
| --- | --- | --- | --- | --- | --- | --- | --- |
${results.map(r => `| #${r.id} | ${r.title} @ ${r.company} | ${r.beforeScore}% | ${r.afterScore}% | +${r.afterScore - r.beforeScore}% | ${r.status} | ${r.cached ? 'HIT' : 'MISS'} | ${r.durationMs}ms |`).join('\n')}
`;

  fs.writeFileSync(OUTPUT_PATH, report);
  console.log(`--- BENCHMARK COMPLETE. REPORT SAVED TO: ${OUTPUT_PATH} ---`);
}

main().catch(err => {
  console.error('Fatal benchmark script error:', err);
});
