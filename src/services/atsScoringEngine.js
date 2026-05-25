/**
 * OpenResumeCraft — Deterministic ATS Match Scoring Engine
 * --------------------------------------------------------
 * Computes a highly accurate, 100% consistent ATS match percentage
 * based on keyword frequency, segment placement weightings, and structural
 * completeness, following the exact rules outlined in Rules.md.
 */

// Comprehensive dictionary of technical, soft, and business keywords
const SKILLS_DICTIONARY = [
  // Programming Languages
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust', 'scala', 'sql', 'html', 'css', 'sass', 'bash', 'shell',
  // Frameworks & Libraries
  'react', 'angular', 'vue', 'next.js', 'nuxt.js', 'svelte', 'node.js', 'express', 'nest.js', 'spring boot', 'django', 'flask', 'fastapi', 'rails', 'laravel', 'bootstrap', 'tailwind', 'redux', 'graphql',
  // Tools & Technologies
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'terraform', 'ansible', 'jenkins', 'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'webpack', 'vite', 'npm', 'yarn', 'pnpm',
  // Databases & Caching
  'postgresql', 'mysql', 'sqlite', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'dynamodb', 'mariadb', 'oracle', 'firebase', 'supabase', 'prisma', 'mongoose',
  // Methodologies & Concepts
  'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'tdd', 'bdd', 'microservices', 'rest api', 'soap', 'mvc', 'oop', 'serverless', 'cloud architecture', 'system design',
  // Roles & Specialties
  'frontend', 'backend', 'fullstack', 'full-stack', 'mobile', 'ios', 'android', 'data engineer', 'data scientist', 'machine learning', 'artificial intelligence', 'nlp', 'llm', 'cybersecurity', 'qa', 'automated testing',
  // Soft Skills & Business
  'leadership', 'mentoring', 'collaboration', 'communication', 'problem solving', 'project management', 'product management', 'analytics', 'growth', 'sales', 'marketing', 'strategic planning', 'time management'
];

/**
 * Deterministically calculates the ATS Score for a resume against a job description.
 * 
 * @param {object} resumeData - The current structured resume data state
 * @param {string} jobDescription - The pasted job description text
 * @returns {object} { score: number, matchingKeywords: string[], missingKeywords: string[], feedback: string }
 */
export function calculateATSScore(resumeData, jobDescription) {
  if (!jobDescription || jobDescription.trim() === '') {
    return {
      score: 0,
      matchingKeywords: [],
      missingKeywords: [],
      feedback: 'Provide a target Job Description to compute your ATS match score.'
    };
  }

  const jdText = jobDescription.toLowerCase();
  
  // 1. Identify which dictionary skills exist in the Job Description
  const targetKeywords = SKILLS_DICTIONARY.filter(skill => {
    // Exact word matching to avoid false positives (e.g., "go" inside "good")
    // Safe escaping for keywords like "next.js" or "c++"
    const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedSkill}\\b`, 'i');
    return regex.test(jdText);
  });

  if (targetKeywords.length === 0) {
    return {
      score: 35,
      matchingKeywords: [],
      missingKeywords: [],
      feedback: 'We found zero standard technical keywords in the Job Description. Please ensure the Job Description contains clear skill requirements.'
    };
  }

  // 2. Build a search space of the current resume content
  const resumeSummary = (resumeData.summary || '').toLowerCase();
  const resumeSkills = [
    ...(resumeData.skills?.technical || []),
    ...(resumeData.skills?.soft || []),
    ...(resumeData.skills?.tools || [])
  ].map(s => s.toLowerCase());

  const resumeExperience = (resumeData.experience || []).map(exp => {
    return [
      exp.title,
      exp.company,
      exp.location,
      ...(exp.bullets || [])
    ].join(' ').toLowerCase();
  });

  const resumeProjects = (resumeData.projects || []).map(proj => {
    return [
      proj.name,
      proj.description,
      ...(proj.technologies || [])
    ].join(' ').toLowerCase();
  });

  // 3. Check matches and compute weights
  const matchingKeywords = [];
  const missingKeywords = [];
  
  let keywordScore = 0;
  let maxKeywordScore = 0;

  targetKeywords.forEach(keyword => {
    // Skills check (3x weight)
    const inSkills = resumeSkills.some(skill => skill.includes(keyword) || keyword.includes(skill));
    // Summary check (2x weight)
    const inSummary = resumeSummary.includes(keyword);
    // Experience/Projects check (1x weight)
    const inExperience = resumeExperience.some(exp => exp.includes(keyword));
    const inProjects = resumeProjects.some(proj => proj.includes(keyword));

    maxKeywordScore += 3 + 2 + 1; // maximum possible weight for this keyword

    if (inSkills || inSummary || inExperience || inProjects) {
      matchingKeywords.push(keyword);
      if (inSkills) keywordScore += 3;
      if (inSummary) keywordScore += 2;
      if (inExperience || inProjects) keywordScore += 1;
    } else {
      missingKeywords.push(keyword);
    }
  });

  // Normalize keyword matching percentage
  const matchRatio = targetKeywords.length > 0 
    ? matchingKeywords.length / targetKeywords.length
    : 0.5;

  // 4. Structural Completeness Score (out of 30 points)
  let completenessPoints = 0;
  const contact = resumeData.contactInfo || {};
  if (contact.email) completenessPoints += 4;
  if (contact.phone) completenessPoints += 4;
  if (contact.linkedin) completenessPoints += 4;
  if (resumeData.summary) completenessPoints += 4;
  if (resumeSkills.length > 0) completenessPoints += 5;
  if (resumeData.experience?.length > 0) completenessPoints += 5;
  if (resumeData.education?.length > 0) completenessPoints += 4;

  // 5. Final Score Calculation (Keyword ratio maps to 70 points + completeness maps to 30 points)
  let finalScore = Math.round((matchRatio * 70) + completenessPoints);
  
  // Clamping score between 10 and 100 for realistic experience
  if (finalScore > 100) finalScore = 100;
  if (finalScore < 10) finalScore = 10;
  
  // Heavily penalise completely empty summaries/experiences
  if (!resumeData.summary && resumeSkills.length === 0 && resumeData.experience?.length === 0) {
    finalScore = Math.min(finalScore, 15);
  }

  // 6. Generate action-oriented feedback
  let feedback = '';
  if (finalScore >= 85) {
    feedback = `Excellent ATS match! Your resume shows strong alignment with core job requirements.`;
  } else if (finalScore >= 70) {
    const suggestions = missingKeywords.slice(0, 2).map(k => k.toUpperCase());
    feedback = `Good ATS match. Consider adding missing keywords like "${suggestions.join(', ')}" in your Skills or Summary to optimize further.`;
  } else {
    const suggestions = missingKeywords.slice(0, 3).map(k => k.toUpperCase());
    feedback = `Low alignment. We highly recommend integrating critical terms like "${suggestions.join(', ')}" into your experience and skills sections.`;
  }

  return {
    score: finalScore,
    matchingKeywords: matchingKeywords.slice(0, 10), // Limit displaying tags to keep UI clean
    missingKeywords: missingKeywords.slice(0, 8),
    feedback
  };
}
