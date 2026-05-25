import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runTest() {
  const docxPath = path.join(__dirname, 'test.docx');
  console.log('Reading test.docx from:', docxPath);
  
  if (!fs.existsSync(docxPath)) {
    console.error('test.docx not found in scratch directory!');
    return;
  }
  
  const fileBuffer = fs.readFileSync(docxPath);
  console.log(`Read ${fileBuffer.length} bytes. Sending to backend...`);
  
  try {
    const res = await fetch('http://localhost:5001/api/extract-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'X-File-Name': 'test.docx'
      },
      body: fileBuffer
    });
    
    console.log('Response Status:', res.status);
    const data = await res.json();
    if (res.ok) {
      console.log('SUCCESS!');
      console.log('Extracted text length:', data.text?.length);
      console.log('Sample text (first 300 chars):');
      console.log(data.text?.substring(0, 300));
    } else {
      console.error('FAILED:', data);
    }
  } catch (err) {
    console.error('Error occurred:', err);
  }
}

runTest();
