/**
 * OpenResumeCraft — Prompt Engine
 * Token-efficient prompt templates for AI resume generation.
 */

// ─── System Prompt ────────────────────────────────────────────────────

/**
 * Build a concise system prompt for resume generation.
 * Optimized for minimal token usage (~350 tokens).
 */
export function buildSystemPrompt() {
  return `You are an expert ATS-optimized resume writer and analyzer. Output ONLY valid JSON matching this exact schema—no markdown, no explanation, no extra text.

JSON Schema:
{
  "contactInfo": {"name":"","email":"","phone":"","location":"","linkedin":"","website":""},
  "summary": "",
  "experience": [{"title":"","company":"","location":"","startDate":"","endDate":"","bullets":[""]}],
  "education": [{"degree":"","institution":"","location":"","year":"","gpa":""}],
  "skills": {"technical":[""],"soft":[""],"tools":[""]},
  "certifications": [{"name":"","issuer":"","year":""}],
  "projects": [{"name":"","description":"","technologies":[""],"link":""}],
  "atsAnalysis": {
    "score": 85,
    "matchingKeywords": ["react", "node"],
    "missingKeywords": ["docker"],
    "feedback": "Strong alignment in core stack. Add tool keywords to boost score further."
  }
}

Rules:
- CRITICAL: Do NOT delete, omit, truncate, or shorten the candidate's existing work history roles, education items, certifications, or projects. You must keep ALL existing items in full.
- Optimize the professional summary, experience bullets, and projects by emphasizing and mirroring keywords and metrics from the job description naturally, but do NOT reduce the number of bullets or omit any historical details.
- Use format: [Action Verb] + [Tool/Technique] + [Quantifiable Result] for experience achievements where applicable.
- Add missing high-priority technical skills from the job description directly into the skills lists, but preserve all existing skills.
- Omit empty sections (return empty arrays)
- Output raw JSON only
- In "atsAnalysis", evaluate the resulting tailored resume against the provided job description and calculate a realistic match percentage (0 to 100). Identify up to 5 matching and 3 missing keywords or skills, and write a 1-sentence actionable feedback.`;
}

// ─── User Prompt Builder ──────────────────────────────────────────────

/**
 * Build the user prompt with resume data and job description.
 * Uses XML delimiters for clear structure and minimal tokens.
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
 * Build a lighter prompt for quick tailoring (rewrite summary + adjust bullets).
 * Uses ~50% fewer tokens than full generation.
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
 * Parse AI response text into structured resume data.
 * Handles markdown code fences, raw JSON, and common formatting issues.
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
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      website: '',
      ...parsed.contactInfo,
    },
    summary: parsed.summary || '',
    experience: (parsed.experience || []).map((exp, i) => ({
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
 * Rough estimate of token count for a string.
 * Uses ~4 chars per token heuristic (good enough for cost estimation).
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Build system prompt for structuring a raw resume text.
 */
export function buildParserSystemPrompt() {
  return `You are an expert resume parser and data extractor. Output ONLY valid JSON matching this exact schema—no markdown, no explanation, no extra text.

JSON Schema:
{
  "contactInfo": {"name":"","email":"","phone":"","location":"","linkedin":"","website":""},
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
 * Build system prompt for performing only ATS match scoring analysis.
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
 * Build the user prompt for scoring.
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
 * Parse the lightweight AI scoring response.
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
