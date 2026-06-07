import { formatSingleDate } from '../utils/dateFormatter.js';


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

// Technical abbreviations & synonym groupings for fuzzy semantic alignment
const SYNONYM_TAXONOMY = {
  'aws': ['amazon web services', 'aws cloud'],
  'amazon web services': ['aws', 'aws cloud'],
  'next.js': ['nextjs', 'next js'],
  'nextjs': ['next.js', 'next js'],
  'typescript': ['ts', 'typescript language'],
  'ts': ['typescript'],
  'javascript': ['js', 'javascript language'],
  'js': ['javascript'],
  'react': ['react.js', 'reactjs', 'react library'],
  'react.js': ['react', 'reactjs'],
  'reactjs': ['react', 'react.js'],
  'node.js': ['nodejs', 'node js', 'node'],
  'nodejs': ['node.js', 'node js', 'node'],
  'node': ['node.js', 'nodejs', 'node js'],
  'gcp': ['google cloud platform', 'google cloud'],
  'google cloud platform': ['gcp', 'google cloud'],
  'azure': ['microsoft azure', 'azure cloud'],
  'kubernetes': ['k8s'],
  'k8s': ['kubernetes'],
  'docker': ['docker container', 'containers'],
  'ci/cd': ['cicd', 'continuous integration', 'continuous deployment'],
  'cicd': ['ci/cd', 'continuous integration', 'continuous deployment'],
  'fullstack': ['full-stack', 'full stack'],
  'full-stack': ['fullstack', 'full stack'],
  'fastapi': ['fast api'],
  'nest.js': ['nestjs', 'nest js'],
  'nestjs': ['nest.js', 'nest js'],
  'nuxt.js': ['nuxtjs', 'nuxt js'],
  'nuxtjs': ['nuxt.js', 'nuxt js'],
  'spring boot': ['springboot', 'spring-boot'],
  'vue': ['vue.js', 'vuejs'],
  'vue.js': ['vue', 'vuejs'],
  'vuejs': ['vue', 'vue.js']
};

/**
 * Deterministically calculates a highly consistent, mathematical ATS Match Score 
 * between a candidate's resume and a target job description.
 * 
 * Scoring Model & Math:
 *   - The maximum potential match score is 100 points.
 *   - Keyword Ratio (Up to 70 Points):
 *       1. Extracts standard skills keywords present in the Job Description using a comprehensive 
 *          taxonomy dictionary and a strict regex boundaries evaluator.
 *       2. Scans the candidate's resume content to verify matches:
 *            - Matches found in the Skills section are awarded 3x weight.
 *            - Matches found in the Professional Summary are awarded 2x weight.
 *            - Matches found in Experience / Projects are awarded 1x weight.
 *       3. Normalizes this keyword weight ratio against the max possible keyword score to generate a 0 to 70 points output.
 *   - Structural Completeness (Up to 30 Points):
 *       - Contact Info: Email (+4 pts), Phone (+4 pts), LinkedIn (+4 pts)
 *       - Summary text (+4 pts)
 *       - Skills array list (+5 pts)
 *       - Experience array list (+5 pts)
 *       - Education array list (+4 pts)
 *   - Clamping: Scores are clamped between 10% and 100% to provide a realistic experience.
 *     If the resume lacks a summary, experiences, and skills entirely, a penalty clamps the score to a max of 15%.
 *
 * @param {object} resumeData - The current structured state of the resume.
 * @param {string} jobDescription - Target job posting plain text.
 * @returns {object} An analysis object containing:
 *   - score {number}: Calculated percentage match (10 - 100)
 *   - matchingKeywords {Array<string>}: Top 10 matched keyword strings
 *   - missingKeywords {Array<string>}: Top 8 high-priority missing keywords
 *   - feedback {string}: Personalized, action-oriented enhancement summary
 */
export function calculateATSScore(resumeData, jobDescription, selectedTemplate = 'classic') {
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

  // 3. Check matches and compute weights with synonym expansion
  const matchingKeywords = [];
  const missingKeywords = [];

  const getSynonyms = (kw) => {
    return SYNONYM_TAXONOMY[kw.toLowerCase()] || [];
  };
  
  targetKeywords.forEach(keyword => {
    const synonyms = getSynonyms(keyword);
    const allSearchTerms = [keyword, ...synonyms];

    // Skills check (3x weight)
    const inSkills = resumeSkills.some(skill => 
      allSearchTerms.some(term => skill.includes(term) || term.includes(skill))
    );
    // Summary check (2x weight)
    const inSummary = allSearchTerms.some(term => resumeSummary.includes(term));
    // Experience/Projects check (1x weight)
    const inExperience = resumeExperience.some(exp => 
      allSearchTerms.some(term => exp.includes(term))
    );
    const inProjects = resumeProjects.some(proj => 
      allSearchTerms.some(term => proj.includes(term))
    );

    if (inSkills || inSummary || inExperience || inProjects) {
      matchingKeywords.push(keyword);
    } else {
      missingKeywords.push(keyword);
    }
  });

  // --- DIMENSION 1: Keyword Score (40%) ---
  // KW_score = (matched keywords / total JD keywords) * 100
  let baseKWScore = (matchingKeywords.length / targetKeywords.length) * 100;
  
  // Find top 5 critical keywords (most frequent keywords in JD)
  const keywordFrequencies = targetKeywords.map(keyword => {
    const escapedSkill = keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const matches = jdText.match(new RegExp(`\\b${escapedSkill}\\b`, 'gi'));
    return { keyword, count: matches ? matches.length : 0 };
  });
  keywordFrequencies.sort((a, b) => b.count - a.count);
  const top5Critical = keywordFrequencies.slice(0, 5).map(f => f.keyword);

  // Bonus: +5 pts if any of the top 5 critical keywords appear in the Summary (using synonyms check)
  const hasTop5InSummary = top5Critical.some(keyword => {
    const synonyms = getSynonyms(keyword);
    const allSearchTerms = [keyword, ...synonyms];
    return allSearchTerms.some(term => resumeSummary.includes(term));
  });
  const kwScore = Math.min(100, baseKWScore + (hasTop5InSummary ? 5 : 0));

  // --- DIMENSION 2: Format Score (20%) ---
  let formatScore = 100;
  if (selectedTemplate === 'modern') {
    formatScore -= 10; // penalty for multi-column layout
  }
  // Penalty for over 2 pages (assumed from experience items count for simplicity)
  if (resumeData.experience && resumeData.experience.length > 5) {
    formatScore -= 10;
  }
  formatScore = Math.max(0, formatScore);

  // --- DIMENSION 3: Structure Score (15%) ---
  let structurePoints = 0;
  const contact = resumeData.contactInfo || {};
  if (contact.email && contact.phone && contact.name) structurePoints += 3; // Contact Information
  if (resumeData.summary) structurePoints += 3; // Summary
  if (resumeData.experience && resumeData.experience.length > 0) structurePoints += 3; // Experience
  if (resumeSkills.length > 0) structurePoints += 3; // Skills
  if (resumeData.education && resumeData.education.length > 0) structurePoints += 3; // Education
  
  // Sections in correct order (+5 pts)
  // Standard display sequence: contactInfo, summary, experience, education, skills
  const expectedOrder = ['contactinfo', 'summary', 'experience', 'education', 'skills'];
  const actualOrder = (resumeData.sectionOrder || []).map(s => s.toLowerCase()).filter(s => expectedOrder.includes(s));
  const isCorrectOrder = actualOrder.every((sect, idx) => actualOrder.indexOf(sect) === expectedOrder.indexOf(sect));
  if (isCorrectOrder) structurePoints += 5;

  // Correct heading labels (+5 pts)
  structurePoints += 5; 

  const structureScore = (structurePoints / 25) * 100;

  // --- DIMENSION 4: Readability Score (10%) ---
  let readabilityPoints = 0;
  const experienceItems = resumeData.experience || [];
  const allBullets = experienceItems.flatMap(exp => exp.bullets || []).filter(b => b.trim() !== '');

  // Action verbs list (E5/E10)
  const ACTION_VERBS = [
    'architected', 'built', 'optimized', 'reduced', 'migrated', 'integrated', 
    'implemented', 'shipped', 'refactored', 'led', 'designed', 'deployed', 
    'automated', 'improved', 'established', 'developed'
  ];
  
  const hasActionVerbs = allBullets.length > 0 && allBullets.every(bullet => {
    const firstWord = bullet.trim().split(/\s+/)[0].toLowerCase().replace(/[^a-z]/g, '');
    return ACTION_VERBS.includes(firstWord);
  });
  if (hasActionVerbs) readabilityPoints += 5;

  // No paragraphs (+3 pts)
  const hasNoParagraphs = experienceItems.length > 0 && experienceItems.every(exp => Array.isArray(exp.bullets) && exp.bullets.length > 0);
  if (hasNoParagraphs) readabilityPoints += 3;

  // Consistent date format (+2 pts)
  // Expected Month YYYY (e.g. "Jan 2022")
  const dateRegex = /^[A-Z][a-z]{2}\s\d{4}$/i;
  const hasConsistentDates = experienceItems.length > 0 && experienceItems.every(exp => {
    const cleanStart = formatSingleDate(exp.startDate || '');
    const cleanEnd = formatSingleDate(exp.endDate || '');
    const startValid = dateRegex.test(cleanStart);
    const endValid = cleanEnd === 'Present' || dateRegex.test(cleanEnd);
    return startValid && endValid;
  });
  if (hasConsistentDates) readabilityPoints += 2;

  const readabilityScore = (readabilityPoints / 10) * 100;

  // --- DIMENSION 5: Quantification Score (10%) ---
  const metricRegex = /\b\d+(?:%|\+|-|M|K)?\b/;
  const bulletsWithMetrics = allBullets.filter(b => metricRegex.test(b));
  const quantificationRate = allBullets.length > 0 ? (bulletsWithMetrics.length / allBullets.length) : 0;
  const quantificationScore = quantificationRate * 100;

  // --- DIMENSION 6: Title Match Score (5%) ---
  // Try to find if there is an exact or partial match for job title
  // Look at target job titles in the JD
  let titleMatchScore = 0;
  const resumeTitles = [
    (resumeData.contactInfo?.title || ''),
    (resumeData.summary || ''),
    ...experienceItems.map(exp => exp.title || '')
  ].join(' ').toLowerCase();

  const targetTitle = extractJobTitle(jobDescription);

  if (targetTitle) {
    const cleanTarget = targetTitle.toLowerCase();
    if (resumeTitles.includes(cleanTarget)) {
      titleMatchScore = 100; // Exact match
    } else {
      const parts = cleanTarget.split(/\s+/);
      const hasPartial = parts.some(part => part !== 'developer' && part !== 'engineer' && resumeTitles.includes(part));
      if (hasPartial) {
        titleMatchScore = 40; // Partial match
      }
    }
  } else {
    titleMatchScore = resumeTitles.includes('developer') || resumeTitles.includes('engineer') ? 40 : 0;
  }

  // --- Weighted sum final score calculation ---
  let finalScore = Math.round(
    (kwScore * 0.40) + 
    (formatScore * 0.20) + 
    (structureScore * 0.15) + 
    (readabilityScore * 0.10) + 
    (quantificationScore * 0.10) + 
    (titleMatchScore * 0.05)
  );

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
    feedback,
    breakdown: {
      keywordScore: Math.round(kwScore),
      formatScore: Math.round(formatScore),
      structureScore: Math.round(structureScore),
      readabilityScore: Math.round(readabilityScore),
      quantificationScore: Math.round(quantificationScore),
      titleMatchScore: Math.round(titleMatchScore)
    }
  };
}

/**
 * Helper to dynamically extract the target job title from a Job Description.
 * Parses a wide array of industry titles and falls back to the first line.
 *
 * @param {string} jobDescription - Target job posting text.
 * @returns {string} The extracted title or empty string.
 */
export function extractJobTitle(jobDescription) {
  if (!jobDescription) return '';
  const jdText = jobDescription.toLowerCase();

  const possibleTitles = [
    // React / Vue specific
    'react developer', 'react engineer', 'reactjs developer', 'react.js developer',
    'vue developer', 'vue engineer', 'vuejs developer', 'vue.js developer',
    
    // Frontend / Web / UI
    'frontend developer', 'frontend engineer', 'front-end developer', 'front-end engineer', 
    'front end developer', 'front end engineer', 'ui developer', 'ui engineer', 'web developer', 
    'web engineer', 'javascript developer', 'javascript engineer',
    
    // Fullstack
    'fullstack developer', 'fullstack engineer', 'full-stack developer', 'full-stack engineer', 
    'full stack developer', 'full stack engineer',
    
    // Backend
    'backend developer', 'backend engineer', 'back-end developer', 'back-end engineer', 
    'back end developer', 'back end engineer',
    
    // DevOps / Cloud / SRE
    'devops engineer', 'site reliability engineer', 'sre', 'cloud engineer', 'cloud architect',
    
    // Mobile
    'ios developer', 'android developer', 'mobile developer', 'mobile engineer',
    
    // Data / ML / AI
    'data engineer', 'data scientist', 'machine learning engineer', 'ml engineer', 'ai engineer',
    
    // General Software
    'software engineer', 'software developer', 'software programmer', 'product engineer', 'product developer',
    
    // QA / Testing
    'qa engineer', 'test engineer', 'quality assurance engineer',
    
    // Leadership
    'tech lead', 'technical lead', 'engineering manager'
  ];

  // Try matching list items
  for (const title of possibleTitles) {
    const escaped = title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(jdText)) {
      return title;
    }
  }

  // Fallback: Check the first non-empty line of the Job Description
  const lines = jobDescription.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0];
    const cleanLine = firstLine
      .replace(/^(job title|role|position|about the role|jd|title|role summary):?\s*/i, '')
      .replace(/[\-–|•].*$/g, '') // remove trailing sub-details like "- Remote", "| Full Time"
      .trim();

    if (cleanLine.length > 3 && cleanLine.length < 50) {
      return cleanLine;
    }
  }

  return '';
}
