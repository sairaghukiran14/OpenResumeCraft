import html2pdf from 'html2pdf.js';

/**
 * Generates a high-quality PDF document from an HTML element in the browser.
 * Utilizes the `html2pdf.js` library which combines `html2canvas` for screenshotting
 * and `jsPDF` for assembling standard paper canvases.
 * 
 * Enforces key configuration values:
 *   - Sanitizes output filenames to avoid terminal path-injection warnings.
 *   - Supports standard dynamic page layouts (Letter vs A4).
 *   - Automatically maps fractional inch margins (e.g. 0.5") to millimeters.
 *   - Incorporates `useCORS` to allow loading externally hosted avatar images safely.
 *
 * @param {string} elementId - The DOM ID of the container element representing the print sheet canvas.
 * @param {string} [filename='resume'] - The target output file name.
 * @param {object} [options={}] - Custom spacing and rendering options.
 *   - paperSize {'letter'|'a4'}: The standard paper format.
 *   - margin {number}: Margin size in fractional inches (e.g., 0.5 or 0.75).
 *   - quality {'high'|'standard'}: DPI scale factor toggle.
 * @returns {Promise<void>} Resolves when the file save dialog triggers successfully.
 * @throws {Error} If target element is not loaded or rendering crashes.
 */
export async function exportToPDF(elementId, filename = 'resume', options = {}) {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Resume preview element #${elementId} not found`);
  }

  const { paperSize = 'letter', margin = 0.5, quality = 'high' } = options;

  // Convert inches to mm: 0.5in = 12.7mm
  const marginMm = margin * 25.4;

  const opt = {
    margin: marginMm,
    filename: `${filename.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: quality === 'high' ? 2 : 1,
      useCORS: true,
      letterRendering: true,
      logging: false,
    },
    jsPDF: {
      unit: 'mm',
      format: paperSize,
      orientation: 'portrait',
    },
    pagebreak: { mode: ['css', 'legacy'] },
  };

  try {
    await html2pdf().set(opt).from(element).save();
  } catch (error) {
    console.error('[PDF Export Error]:', error);
    throw new Error(`Failed to generate PDF: ${error.message}`);
  }
}
