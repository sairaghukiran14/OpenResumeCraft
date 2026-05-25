import html2pdf from 'html2pdf.js';

/**
 * High-quality client-side PDF export wrapping html2pdf.js.
 * Optimized for professional margins, letter/a4 standard sizes, and high resolution.
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
