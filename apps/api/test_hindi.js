const q = async () => {
  const res = await fetch('http://localhost:8002/api/v1/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: "परंपरागत कृषि विकास योजना के लिए आवेदन कर सकता हूं?", language: "hi" })
  });
  console.log(JSON.stringify(await res.json(), null, 2));
};
q();
