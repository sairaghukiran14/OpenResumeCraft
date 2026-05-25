async function test() {
  console.log('Testing Express backend /api/generate directly...');
  const start = Date.now();
  try {
    const res = await fetch('http://localhost:5001/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        providerId: 'openai',
        modelId: 'gpt-4o',
        apiKey: 'test_key',
        systemPrompt: 'You are a helpful assistant',
        userPrompt: 'Tell me a joke',
        useCache: false
      })
    });
    console.log(`Status: ${res.status} in ${Date.now() - start}ms`);
    const data = await res.json();
    console.log('Response:', data);
  } catch (err) {
    console.error(`Error in ${Date.now() - start}ms:`, err);
  }
}
test();
