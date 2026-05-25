import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

console.log('pdfParse top-level type:', typeof pdfParse);
console.log('pdfParse top-level keys:', Object.keys(pdfParse));
console.log('PDFParse type:', typeof pdfParse.PDFParse);

