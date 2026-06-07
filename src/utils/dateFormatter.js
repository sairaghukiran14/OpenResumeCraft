/**
 * Date Formatter Utility
 * ----------------------
 * Standardizes non-compliant date strings to standard 3-letter Month YYYY format.
 */

const MONTHS_MAP = {
  january: 'Jan', jan: 'Jan', '01': 'Jan', '1': 'Jan',
  february: 'Feb', feb: 'Feb', '02': 'Feb', '2': 'Feb',
  march: 'Mar', mar: 'Mar', '03': 'Mar', '3': 'Mar',
  april: 'Apr', apr: 'Apr', '04': 'Apr', '4': 'Apr',
  may: 'May', '05': 'May', '5': 'May',
  june: 'Jun', jun: 'Jun', '06': 'Jun', '6': 'Jun',
  july: 'Jul', jul: 'Jul', '07': 'Jul', '7': 'Jul',
  august: 'Aug', aug: 'Aug', '08': 'Aug', '8': 'Aug',
  september: 'Sep', sep: 'Sep', '09': 'Sep', '9': 'Sep',
  october: 'Oct', oct: 'Oct', '10': 'Oct',
  november: 'Nov', nov: 'Nov', '11': 'Nov',
  december: 'Dec', dec: 'Dec', '12': 'Dec'
};

/**
 * Standardizes a single date string (e.g. "2022-01", "01/2022", "June 2022") to "Month YYYY".
 * Returns "Present" if the value is current or present.
 *
 * @param {string} dateStr - Input date string.
 * @returns {string} Normalized date string.
 */
export function formatSingleDate(dateStr) {
  if (!dateStr) return '';
  const clean = dateStr.trim().toLowerCase();
  
  if (clean === 'present' || clean === 'current') return 'Present';

  // Format 1: YYYY-MM or MM/YYYY
  const parts = clean.split(/[-/]/);
  if (parts.length === 2) {
    const first = parts[0];
    const second = parts[1];
    
    if (first.length === 4 && !isNaN(first)) { // YYYY-MM
      const m = MONTHS_MAP[second] || 'Jan';
      return `${m} ${first}`;
    }
    if (second.length === 4 && !isNaN(second)) { // MM/YYYY
      const m = MONTHS_MAP[first] || 'Jan';
      return `${m} ${second}`;
    }
  }

  // Format 2: Month YYYY or Month, YYYY
  const words = clean.replace(/,/g, '').split(/\s+/);
  if (words.length === 2) {
    const monthWord = words[0];
    const yearWord = words[1];
    const m = MONTHS_MAP[monthWord];
    
    if (m && yearWord.length === 4 && !isNaN(yearWord)) {
      return `${m} ${yearWord}`;
    }
  }

  // Fallback: Capitalize first letters of each word
  return dateStr.trim().replace(/\b[a-z]/g, char => char.toUpperCase());
}
