async function test() {
  console.log('Testing Node fetch to api.openai.com...');
  const start = Date.now();
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_key'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'hello' }]
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
