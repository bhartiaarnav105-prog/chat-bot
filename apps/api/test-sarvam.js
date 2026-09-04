require('dotenv').config();
const fs = require('fs');
const { SarvamAIClient } = require('sarvamai');

async function main() {
  console.log("Starting Sarvam SDK Test...");

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    console.error("FAIL: SARVAM_API_KEY environment variable is missing.");
    process.exit(1);
  }

  // Do not log the key itself
  console.log("[SARVAM] API key configured: true");

  const client = new SarvamAIClient({
    apiSubscriptionKey: apiKey,
  });

  const testAudioPath = './test.wav';
  if (!fs.existsSync(testAudioPath)) {
    console.log(`Could not find ${testAudioPath} for testing. Please place an audio file named test.wav in this directory.`);
    console.log("Skipping actual API call due to missing test file.");
    process.exit(0);
  }

  console.log(`[STT] Sending audio to Sarvam`);
  
  try {
    const audioBuffer = fs.readFileSync(testAudioPath);
    // Mimic the File object in node using a Blob
    const blob = new Blob([audioBuffer], { type: 'audio/wav' });
    const audioFile = new File([blob], 'test.wav', { type: 'audio/wav' });

    const response = await client.speechToText.transcribe({
      file: audioFile,
      model: 'saaras:v3',
      languageCode: 'en-IN',
      mode: 'transcribe'
    });

    console.log(`[STT] Sarvam response received`);
    console.log(`[STT] Sarvam response:`, JSON.stringify(response, null, 2));
    
    if (!response || !response.transcript || response.transcript.trim() === '') {
      console.error("FAIL: Sarvam returned an empty transcript.");
      process.exit(1);
    }

    console.log(`[STT] Transcript: ${response.transcript}`);
    console.log("SUCCESS: Sarvam STT test completed successfully.");
    process.exit(0);

  } catch (err) {
    console.error("FAIL: Sarvam API request failed.", err.message);
    process.exit(1);
  }
}

main();
