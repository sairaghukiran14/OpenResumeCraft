/**
 * Action Verb Processor Utility
 * -----------------------------
 * Validates the first word of experience bullets and standardizes them to a 
 * whitelisted ATS action verb, ensuring maximum readability scores.
 */

const ACTION_VERBS = [
  'architected', 'built', 'optimized', 'reduced', 'migrated', 'integrated', 
  'implemented', 'shipped', 'refactored', 'led', 'designed', 'deployed', 
  'automated', 'improved', 'established', 'developed'
];

// Map of common non-action or weak verbs to whitelisted ATS strong verbs
const VERB_SYNONYM_MAP = {
  spearheaded: 'led',
  managed: 'led',
  directed: 'led',
  created: 'built',
  crafted: 'built',
  made: 'built',
  coded: 'built',
  authored: 'designed',
  wrote: 'implemented',
  designed: 'designed',
  accelerated: 'optimized',
  maximized: 'improved',
  boosted: 'improved',
  increased: 'improved',
  enhanced: 'improved',
  decreased: 'reduced',
  lowered: 'reduced',
  cut: 'reduced',
  transferred: 'migrated',
  moved: 'migrated',
  merged: 'integrated',
  combined: 'integrated',
  unified: 'integrated',
  launched: 'deployed',
  published: 'deployed'
};

/**
 * Standardizes the first word of a bullet point to start with an ATS action verb.
 *
 * @param {string} bullet - The input bullet point text.
 * @returns {string} The verb-aligned bullet point string.
 */
export function alignActionVerb(bullet) {
  if (!bullet || typeof bullet !== 'string') return '';
  const trimmed = bullet.trim();
  if (trimmed.length === 0) return '';

  const words = trimmed.split(/\s+/);
  const firstWord = words[0];
  const firstWordClean = firstWord.toLowerCase().replace(/[^a-z]/g, '');

  // If first word is already whitelisted, return as-is
  if (ACTION_VERBS.includes(firstWordClean)) {
    return trimmed;
  }

  // If there's a direct strong mapping, replace it
  const mappedVerb = VERB_SYNONYM_MAP[firstWordClean];
  if (mappedVerb) {
    const capitalizedMapped = mappedVerb.charAt(0).toUpperCase() + mappedVerb.slice(1);
    const rest = words.slice(1).join(' ');
    // Keep casing of punctuation/endings
    return `${capitalizedMapped} ${rest}`;
  }

  // Fallback: prepend "Optimized" and make the original first word lowercase
  const firstWordLower = firstWord.charAt(0).toLowerCase() + firstWord.slice(1);
  const rest = words.slice(1).join(' ');
  return `Optimized ${firstWordLower} ${rest}`;
}

/**
 * Post-processes an entire work experience items list to align bullet action verbs.
 *
 * @param {Array<object>} experience - List of work experience entries.
 * @returns {Array<object>} Processed experience entries.
 */
export function processExperienceBullets(experience) {
  if (!Array.isArray(experience)) return [];
  return experience.map(exp => {
    const bullets = Array.isArray(exp.bullets)
      ? exp.bullets.map(b => alignActionVerb(b)).filter(Boolean)
      : [];
    return { ...exp, bullets };
  });
}
