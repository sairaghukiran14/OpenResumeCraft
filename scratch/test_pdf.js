import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// A minimal valid 1-page PDF file content in binary buffer format
const minimalPdfBuffer = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
  '2 0 obj << /Type /Pages /Kids [ 3 0 R ] /Count 1 >> endobj\n' +
  '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [ 0 0 612 792 ] /Resources << >> /Contents 4 0 R >> endobj\n' +
  '4 0 obj << /Length 51 >> stream\n' +
  'BT /F1 12 Tf 72 712 Td (Hello world from OpenResumeCraft) Tj ET\n' +
  'endstream endobj\n' +
  'xref\n' +
  '0 5\n' +
  '0000000000 65535 f \n' +
  '0000000009 00000 n \n' +
  '0000000058 00000 n \n' +
  '0000000115 00000 n \n' +
  '0000000222 00000 n \n' +
  'trailer << /Size 5 /Root 1 0 R >>\n' +
  'startxref\n' +
  '322\n' +
  '%%EOF'
);

pdfParse(minimalPdfBuffer).then(function(data) {
  console.log('--- Successfully parsed PDF ---');
  console.log('Number of pages:', data.numpages);
  console.log('Metadata:', data.info);
  console.log('Extracted text:', JSON.stringify(data.text));
}).catch(function(err) {
  console.error('--- PDF Parsing failed ---', err);
});
