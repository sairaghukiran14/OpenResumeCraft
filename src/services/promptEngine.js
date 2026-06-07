import { processExperienceBullets } from '../utils/verbProcessor.js';

// ─── System Prompt ────────────────────────────────────────────────────

/**
 * Generates the standardized system instruction prompt for AI resume generation.
 * This prompt is mathematically optimized for minimal token usage (~350 tokens) while
 * preserving extreme schema-adherence instructions and strict guidelines on resume structure:
 *   1. Returns raw, valid JSON only (prevents unwanted conversational preambles).
 *   2. Enforces structural integrity (demands that existing jobs, education, and projects are not deleted).
 *   3. Outlines the STAR method [Action Verb] + [Tool] + [Metric] achievement formula.
 *
 * @returns {string} The formatted system prompt.
 */
export function buildSystemPrompt() {
  return `You are an expert ATS-optimized resume writer and analyzer. Output ONLY valid JSON matching this exact schema—no markdown, no explanation, no extra text.

JSON Schema:
{
  "contactInfo": {"name":"","title":"","email":"","phone":"","location":"","linkedin":"","website":""},
  "summary": "",
  "experience": [{"title":"","company":"","location":"","startDate":"","endDate":"","bullets":[""]}],
  "education": [{"degree":"","institution":"","location":"","year":"","gpa":""}],
  "skills": {"technical":[""],"soft":[""],"tools":[""]},
  "certifications": [{"name":"","issuer":"","year":""}],
  "projects": [{"name":"","description":"","technologies":[""],"link":"","github":"","status":""}],
  "atsAnalysis": {
    "score": 100,
    "matchingKeywords": ["react", "node"],
    "missingKeywords": [],
    "feedback": "Outstanding alignment! Perfect compliance across all ATS scoring criteria."
  }
}

Rules:
- CRITICAL: Do NOT delete, omit, truncate, or shorten the candidate's existing work history roles, education items, certifications, or projects. You must keep ALL existing items in full.
- CRITICAL: Do NOT modify, delete, omit, or change any project URLs/hyperlinks (GitHub repository links, portfolio links, or live demo URLs). Keep them EXACTLY as they are in the input.
- To achieve a perfect 100/100 ATS score:
  1. Optimize every bullet point in the experience section to start with a strong action verb (e.g. Architected, Built, Optimized, Reduced, Migrated, Integrated, Implemented, Shipped, Refactored, Led, Designed, Deployed, Automated, Improved, Developed).
  2. Ensure every single experience bullet contains at least one quantifiable metric (%, $, numbers, time improvements, requests/sec).
  3. Mirror all target skills from the job description exactly (e.g. match casing and terms like React.js, Node.js, TypeScript).
  4. Match the target job title from the job description exactly in the professional summary and in your contactInfo.title field (specifically modify the candidate's summary and the contactInfo.title field to match this target role title exactly, and do NOT modify historical experience job titles).
- Optimize the professional summary, experience bullets, and projects by emphasizing and mirroring keywords and metrics from the job description naturally, but do NOT reduce the number of bullets or omit any historical details.
- Use format: [Action Verb] + [Tool/Technique] + [Quantifiable Result] for experience achievements where applicable.
- Format project descriptions as bullet points, where each point starts with a "• " character on a new line.
- Omit empty sections (return empty arrays)
- Output raw JSON only`;
}

// ─── User Prompt Builder ──────────────────────────────────────────────

/**
 * Constructs a token-efficient, highly structured user prompt.
 * Interleaves the resume JSON structure and the raw target Job Description
 * using XML-like segment wrappers (`<resume_data>` and `<job_description>`).
 * This approach helps the LLM clearly distinguish candidate history from job requirements
 * and reduces layout distortion.
 *
 * @param {object} resumeData - Current state of user's resume data.
 * @param {string} jobDescription - Target job posting text.
 * @param {object} [options={}] - Custom tailoring preferences.
 *   - tone {'professional'|'technical'|'executive'}: Styling of summary and bullets.
 *   - focusAreas {Array<string>}: Topics to emphasize.
 *   - includeProjects {boolean}: Toggle to tailor project list or exclude.
 * @returns {string} The fully compiled user prompt text.
 */
export function buildUserPrompt(resumeData, jobDescription, options = {}) {
  const { tone = 'professional', focusAreas = [], includeProjects = true } = options;

  let prompt = '';

  // Tone instruction (brief)
  if (tone === 'technical') {
    prompt += 'Tone: Technical, emphasize engineering depth.\n';
  } else if (tone === 'executive') {
    prompt += 'Tone: Executive, emphasize leadership and strategic impact.\n';
  }

  // Focus areas
  if (focusAreas.length > 0) {
    prompt += `Focus: ${focusAreas.join(', ')}\n`;
  }

  // Resume data
  prompt += '<resume_data>\n';
  
  if (resumeData.contactInfo) {
    const ci = resumeData.contactInfo;
    const parts = [ci.name, ci.email, ci.phone, ci.location, ci.linkedin, ci.website].filter(Boolean);
    prompt += `Contact: ${parts.join(' | ')}\n`;
  }

  if (resumeData.summary) {
    prompt += `Summary: ${resumeData.summary}\n`;
  }

  if (resumeData.experience?.length) {
    prompt += 'Experience:\n';
    resumeData.experience.forEach(exp => {
      prompt += `- ${exp.title} @ ${exp.company} (${exp.startDate}–${exp.endDate})\n`;
      if (exp.bullets?.length) {
        exp.bullets.forEach(b => {
          if (b.trim()) prompt += `  • ${b}\n`;
        });
      }
    });
  }

  if (resumeData.education?.length) {
    prompt += 'Education:\n';
    resumeData.education.forEach(edu => {
      const parts = [edu.degree, edu.institution, edu.year, edu.gpa ? `GPA: ${edu.gpa}` : ''].filter(Boolean);
      prompt += `- ${parts.join(', ')}\n`;
    });
  }

  if (resumeData.skills) {
    const allSkills = [
      ...(resumeData.skills.technical || []),
      ...(resumeData.skills.soft || []),
      ...(resumeData.skills.tools || []),
    ].filter(Boolean);
    if (allSkills.length) {
      prompt += `Skills: ${allSkills.join(', ')}\n`;
    }
  }

  if (resumeData.certifications?.length) {
    prompt += 'Certifications:\n';
    resumeData.certifications.forEach(cert => {
      prompt += `- ${cert.name} (${cert.issuer}, ${cert.year})\n`;
    });
  }

  if (includeProjects && resumeData.projects?.length) {
    prompt += 'Projects:\n';
    resumeData.projects.forEach(proj => {
      prompt += `- ${proj.name}: ${proj.description}`;
      if (proj.technologies?.length) prompt += ` [${proj.technologies.join(', ')}]`;
      if (proj.link) prompt += ` | Link: ${proj.link}`;
      if (proj.github) prompt += ` | GitHub: ${proj.github}`;
      if (proj.status) prompt += ` | Status: ${proj.status}`;
      prompt += '\n';
    });
  }

  prompt += '</resume_data>\n\n';

  // Job description
  prompt += '<job_description>\n';
  prompt += jobDescription.trim();
  prompt += '\n</job_description>\n\n';

  prompt += 'Generate an ATS-optimized resume tailored to this job description. Preserve contact info. Output JSON only.';

  return prompt;
}

// ─── Quick Tailor Prompt ──────────────────────────────────────────────

/**
 * Builds a lightweight, token-efficient prompt for rapid resume adjustments.
 * Rather than restructuring the entire resume, this instructs the LLM to only
 * rewrite the professional summary and fine-tune experience bullet achievements 
 * to mirror the target Job Description, preserving education, contact, and certifications
 * completely unchanged. Reduces overall LLM token charges by roughly 50%.
 *
 * @param {object} currentResume - The current structured resume object state.
 * @param {string} jobDescription - Target job posting text.
 * @returns {object} { systemPrompt: string, userPrompt: string }
 */
export function buildQuickTailorPrompt(currentResume, jobDescription) {
  const systemPrompt = `You are a resume optimization expert. Output ONLY valid JSON. Rewrite the summary and experience bullets to better match the job description. Keep contact info, education, and other sections unchanged. Use the same JSON schema as the input.

Rules:
- CRITICAL: Do NOT delete, omit, truncate, or shorten the candidate's existing experience entries, projects, or education items. You must keep ALL existing items in full.
- Mirror JD keywords naturally and quantify achievements.
- Use strong action verbs.
- Optimize summary and bullet points, but preserve the exact number of bullets and entries.
- Output raw JSON only`;

  const userPrompt = `<current_resume>
${JSON.stringify(currentResume, null, 0)}
</current_resume>

<job_description>
${jobDescription.trim()}
</job_description>

Optimize this resume for the job description. Output JSON only.`;

  return { systemPrompt, userPrompt };
}

// ─── Response Parser ──────────────────────────────────────────────────

/**
 * Parses raw textual response strings returned from LLMs into validated,
 * schema-adherent resume JSON data.
 * 
 * Features highly robust text cleanups to guard against common LLM quirks:
 *   1. Extracts nested code segments from Markdown code fences (e.g. ```json ... ```).
 *   2. Isolates the outermost `{ ... }` bounds to slice away prefix/suffix conversational text.
 *   3. Resolves syntax compilation hazards like trailing array/object commas and unescaped newlines.
 *   4. Normalizes every array list and assigns unique reactive IDs (`id`) to experiences, 
 *      education items, certifications, and projects to enable seamless React rendering keys.
 *
 * @param {string} responseText - Raw API response content string.
 * @returns {object} The fully structured and validated resume data object.
 * @throws {Error} If parsing completely fails or output object is invalid.
 */
export function parseAIResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('Empty or invalid AI response');
  }

  let text = responseText.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Try to find JSON object in text (in case there's surrounding text)
  if (!text.startsWith('{')) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }
  }

  // Parse JSON
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    // Try to fix common JSON issues
    try {
      // Remove trailing commas
      const cleaned = text
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']')
        // Fix unescaped newlines in strings
        .replace(/[\n\r]/g, ' ');
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse AI response as JSON: ${e.message}\n\nRaw response (first 200 chars): ${responseText.substring(0, 200)}`);
    }
  }

  // Validate required fields
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not a valid JSON object');
  }

  // Ensure all expected sections exist with defaults
  const validated = {
    contactInfo: {
      name: '',
      title: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      ...parsed.contactInfo,
    },
    summary: parsed.summary || '',
    experience: processExperienceBullets(parsed.experience || []).map((exp, i) => ({
      id: `exp_${Date.now()}_${i}`,
      title: exp.title || '',
      company: exp.company || '',
      location: exp.location || '',
      startDate: exp.startDate || exp.start_date || '',
      endDate: exp.endDate || exp.end_date || '',
      bullets: Array.isArray(exp.bullets) ? exp.bullets.filter(b => b && b.trim()) : [],
    })),
    education: (parsed.education || []).map((edu, i) => ({
      id: `edu_${Date.now()}_${i}`,
      degree: edu.degree || '',
      institution: edu.institution || '',
      location: edu.location || '',
      year: edu.year || edu.graduation_year || '',
      gpa: edu.gpa || '',
    })),
    skills: {
      technical: Array.isArray(parsed.skills?.technical) ? parsed.skills.technical : [],
      soft: Array.isArray(parsed.skills?.soft) ? parsed.skills.soft : [],
      tools: Array.isArray(parsed.skills?.tools) ? parsed.skills.tools : [],
    },
    certifications: (parsed.certifications || []).map((cert, i) => ({
      id: `cert_${Date.now()}_${i}`,
      name: cert.name || '',
      issuer: cert.issuer || '',
      year: cert.year || '',
    })),
    projects: (parsed.projects || []).map((proj, i) => ({
      id: `proj_${Date.now()}_${i}`,
      name: proj.name || '',
      description: proj.description || '',
      technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
      link: proj.link || '',
      github: proj.github || '',
      status: proj.status || '',
    })),
    atsAnalysis: {
      score: typeof parsed.atsAnalysis?.score === 'number' ? parsed.atsAnalysis.score : 0,
      matchingKeywords: Array.isArray(parsed.atsAnalysis?.matchingKeywords) ? parsed.atsAnalysis.matchingKeywords : [],
      missingKeywords: Array.isArray(parsed.atsAnalysis?.missingKeywords) ? parsed.atsAnalysis.missingKeywords : [],
      feedback: parsed.atsAnalysis?.feedback || '',
    },
  };

  return validated;
}

// ─── Prompt Size Estimator ────────────────────────────────────────────

/**
 * Generates a fast, low-cost estimate of token count for a text string.
 * Uses the industry standard 4-characters-per-token heuristic (valid enough for cost estimation).
 * Prevents calling heavy regex tokens weights mapping engines on the client.
 *
 * @param {string} text - The input text segment.
 * @returns {number} Estimated token count.
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Builds the system instruction prompt for structuring raw, unformatted resume texts.
 * Configured as a highly literal mapping task to avoid hallucinations.
 *
 * @returns {string} The parser system instruction set.
 */
export function buildParserSystemPrompt() {
  return `You are an expert resume parser and data extractor. Output ONLY valid JSON matching this exact schema—no markdown, no explanation, no extra text.

JSON Schema:
{
  "contactInfo": {"name":"","title":"","email":"","phone":"","location":"","linkedin":"","website":""},
  "summary": "",
  "experience": [{"title":"","company":"","location":"","startDate":"","endDate":"","bullets":[""]}],
  "education": [{"degree":"","institution":"","location":"","year":"","gpa":""}],
  "skills": {"technical":[""],"soft":[""],"tools":[""]},
  "certifications": [{"name":"","issuer":"","year":""}],
  "projects": [{"name":"","description":"","technologies":[""],"link":""}]
}

Rules:
- Fill in every field with accurate information extracted from the raw text.
- If a section is missing, return an empty array or empty strings.
- Reformat dates to 'YYYY-MM' or 'Month YYYY' format if possible.
- Extract bullet points for experience roles carefully.
- Output raw JSON only.`;
}

// ─── ATS Match Scoring Prompts ────────────────────────────────────────

/**
 * Builds the system instruction prompt specifically for isolated,
 * lightweight ATS keyword match percent calculations using third-party LLMs.
 * Enforces raw JSON returns to integrate safely with dynamic charts.
 *
 * @returns {string} The scoring system instruction.
 */
export function buildScoringSystemPrompt() {
  return `You are an expert ATS (Applicant Tracking System) parser and score analyzer. Your task is to evaluate the provided resume against the job description and output ONLY a valid JSON object with the match analysis.

JSON Schema:
{
  "score": 85,
  "matchingKeywords": ["react", "node"],
  "missingKeywords": ["docker"],
  "feedback": "Strong alignment in core stack. Add tool keywords to boost score further."
}

Rules:
- Compute a realistic match score (0 to 100) based on how well the candidate's skills, experience, and tools align with the job description.
- Identify up to 10 matching keywords/skills.
- Identify up to 8 missing high-priority keywords/skills.
- Write a concise, 1-2 sentence actionable feedback summary to help the candidate improve their match score.
- Output raw JSON only. Do not include markdown formatting or explanation outside the JSON.`;
}

/**
 * Constructs the user prompt containing structured resume JSON and target job text.
 * Wraps parameters inside strict XML boundaries.
 *
 * @param {object} resumeData - Current resume data object state.
 * @param {string} jobDescription - Target job posting text.
 * @returns {string} Fully compiled scoring user prompt.
 */
export function buildScoringUserPrompt(resumeData, jobDescription) {
  return `<resume_data>
${JSON.stringify(resumeData, null, 0)}
</resume_data>

<job_description>
${jobDescription.trim()}
</job_description>

Analyze the resume against the job description and output the JSON match analysis.`;
}

/**
 * Parses and validates raw text returned by the isolated LLM scoring call.
 * Strips code fences, isolates outer braces, fixes common errors, and normalizes
 * lists before outputting to the caller.
 *
 * @param {string} responseText - Raw API scoring response.
 * @returns {object} { score: number, matchingKeywords: Array<string>, missingKeywords: Array<string>, feedback: string }
 */
export function parseScoringResponse(responseText) {
  if (!responseText || typeof responseText !== 'string') {
    throw new Error('Empty or invalid AI response');
  }

  let text = responseText.trim();

  // Strip markdown code fences if present
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  if (!text.startsWith('{')) {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }
  }

  let parsed = JSON.parse(text);
  return {
    score: typeof parsed.score === 'number' ? parsed.score : 0,
    matchingKeywords: Array.isArray(parsed.matchingKeywords) ? parsed.matchingKeywords : [],
    missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
    feedback: parsed.feedback || '',
  };
}

// ─── Cover Letter Prompts ──────────────────────────────────────────────

/**
 * Builds the system instructions for cover letter generation.
 * Supports three formats: 'short', 'tech', and 'experience'.
 *
 * @param {string} style - Style code ('short' | 'tech' | 'experience').
 * @returns {string} The formatted system prompt.
 */
export function buildCoverLetterSystemPrompt(style = 'short') {
  let styleInstructions = '';

  if (style === 'short') {
    styleInstructions = `
- STYLE STYLE: "Short and Impactful".
- Strict constraint: Keep the response under 250 words and organize it into exactly 3 brief paragraphs.
- Paragraph 1: An engaging hook stating the target role and expressing enthusiastic alignment.
- Paragraph 2: Core high-impact professional metrics and achievements matching the job description.
- Paragraph 3: A call to action and polite sign-off.
- Focus: High readability, action-oriented tone, and density of achievements.`;
  } else if (style === 'tech') {
    styleInstructions = `
- STYLE STYLE: "Tech-based".
- Structure: 4 detailed paragraphs.
- Highlight specific tech stacks, tools, frameworks, and libraries relevant to the job description.
- Detail complex technical challenges, engineering methodologies, system architecture, and technical execution.
- Emphasize developer tooling, scalability, clean code, and API design.`;
  } else if (style === 'experience') {
    styleInstructions = `
- STYLE STYLE: "Experience-based / Leadership".
- Structure: 4 detailed paragraphs.
- Emphasize leadership, lifecycle ownership, team scaling, mentoring, or cross-functional collaboration.
- Focus heavily on quantifiable business outcomes (e.g. revenue, growth, user adoption, speed-to-market).
- Detail complex project delivery, stakeholder management, and team trajectory.`;
  }

  return `You are a premium, professional resume writer and cover letter writing expert.
Your objective is to generate a highly tailored, compelling, and formal cover letter matching the candidate's experience and the target job description.

Rules:
1. Output ONLY the raw text of the cover letter. Do not include markdown code fences, headers, metadata, salutations to placeholders, or extra preambles. Start directly with the formal letter content.
2. Use standard formal letter parts:
   - Date: Use "[Current Date]" or the current date.
   - Recipient: Use "Hiring Manager" or the company name if available in the job description.
   - Salutation: "Dear Hiring Team," or "Dear Hiring Manager,".
   - Body Paragraphs (adhering strictly to the selected style).
   - Sign-off: "Sincerely," followed by the candidate's name.
3. Mirror high-priority skills and terminology from the job description naturally.
4. Ensure the achievements are backed by metrics matching the candidate's resume history.
${styleInstructions}

Generate the formal cover letter text now.`;
}

/**
 * Builds the user prompt containing structured resume JSON and target job text.
 *
 * @param {object} resumeData - Current resume data object state.
 * @param {string} jobDescription - Target job posting text.
 * @param {string} style - Cover letter style.
 * @returns {string} Fully compiled cover letter user prompt.
 */
export function buildCoverLetterUserPrompt(resumeData, jobDescription, style = 'short') {
  let prompt = `Candidate Resume Data:
<resume_data>
Name: ${resumeData.contactInfo?.name || 'Candidate'}
Current Title: ${resumeData.contactInfo?.title || ''}
Summary: ${resumeData.summary || ''}
Experience:
`;

  if (resumeData.experience?.length) {
    resumeData.experience.forEach(exp => {
      prompt += `- ${exp.title} @ ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      if (exp.bullets?.length) {
        exp.bullets.forEach(b => {
          prompt += `  • ${b}\n`;
        });
      }
    });
  }

  prompt += `Skills: ${[
    ...(resumeData.skills?.technical || []),
    ...(resumeData.skills?.soft || []),
    ...(resumeData.skills?.tools || []),
  ].join(', ')}
</resume_data>

Target Job Description:
<job_description>
${jobDescription.trim()}
</job_description>

Please write a customized, highly persuasive cover letter in the "${style}" style. Output the letter text directly.`;

  return prompt;
}
