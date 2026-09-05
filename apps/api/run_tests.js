const tests = [
  "I am a farmer and need financial help for my crops",
  "मैं एक किसान हूँ और मुझे फसल के लिए आर्थिक सहायता चाहिए",
  "Mujhe kisan ke liye sarkari yojana chahiye",
  "Are there any government schemes for students?",
  "I want help with space travel"
];

async function runTests() {
  for (let i = 0; i < tests.length; i++) {
    console.log(`\n=================== TEST ${i + 1} ===================`);
    console.log(`Query: ${tests[i]}`);
    try {
      const res = await fetch('http://localhost:8002/api/v1/assistant/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: tests[i] })
      });
      const data = await res.json();
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.error('Error:', e);
    }
  }
}

runTests();
