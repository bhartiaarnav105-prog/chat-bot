import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'MISSING_KEY' });

export interface LanguageDetectionResult {
  language: string;
  scriptStyle: string;
  fullDescription: string;
}

/**
 * Detects the language and script of a given query.
 * Uses a fast local check for obvious scripts, but defaults to Gemini for accuracy,
 * especially to distinguish Roman-script languages (English vs Hinglish) and
 * Devanagari languages (Hindi vs Marathi).
 */
export async function detectLanguage(query: string): Promise<LanguageDetectionResult> {
  // Fast local script check hints
  let scriptHint = 'Unknown';
  if (/^[\x00-\x7F]*$/.test(query)) {
    scriptHint = 'Roman';
  } else if (/[\u0900-\u097F]/.test(query)) {
    scriptHint = 'Devanagari';
  } else if (/[\u0B80-\u0BFF]/.test(query)) {
    scriptHint = 'Tamil';
  }

  // Use Gemini to get the exact language and style classification
  const prompt = `
Analyze the following user query and determine its language and script/style.
Pay special attention to distinguishing between:
- English
- Hindi (Devanagari)
- Hinglish (Roman script Hindi)
- Marathi (Devanagari)
- Tamil (Tamil script)
- Other Indian languages

User query: "${query}"
Script hint: ${scriptHint}

Respond strictly in valid JSON format with the following keys:
- "language": The exact language (e.g., "English", "Hindi", "Hinglish", "Marathi", "Tamil"). Do not use "Hinglish" as a language if it's pure English. If it's Roman script Hindi, use "Hinglish".
- "scriptStyle": The script or style used (e.g., "Roman", "Devanagari", "Tamil"). For Hinglish, use "Roman".

JSON response only:
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        language: parsed.language || 'English',
        scriptStyle: parsed.scriptStyle || 'Roman',
        fullDescription: `${parsed.language} (${parsed.scriptStyle})`
      };
    }
  } catch (error) {
    console.error('[LANGUAGE DETECTION ERROR]', error);
  }

  // Fallback
  return {
    language: 'English',
    scriptStyle: 'Roman',
    fullDescription: 'English (Roman)'
  };
}

/**
 * Adapts the factual scheme data into the exact language, script, and conversational style
 * of the user's original query.
 */
export async function adaptResponse(originalQuestion: string, detectedLanguage: LanguageDetectionResult, retrievedSchemeData: any): Promise<string> {
  const prompt = `You are a language adaptation layer.

Original user question:
${originalQuestion}

Detected language and style:
${detectedLanguage.fullDescription}

Factual information retrieved from Supabase:
${JSON.stringify(retrievedSchemeData, null, 2)}

Return the answer in exactly the same language, script, and conversational style as the user's original question.

Rules:
* Use ONLY the factual information supplied above.
* Do not search for additional information.
* Do not add facts.
* Do not guess missing information.
* Do not change dates, scheme names, eligibility, benefits, or official links.
* Do not remove important factual information.
* If the input is Hinglish, return Roman-script Hinglish.
* If the input is Hindi, return Hindi.
* If the input is Marathi, return Marathi.
* If the input is English, return English.
* Return only the final user-facing answer.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        temperature: 0.1,
      }
    });

    return (response.text || '').trim();
  } catch (error) {
    console.error('[LANGUAGE ADAPTATION ERROR]', error);
    // Fallback if adaptation fails
    return retrievedSchemeData.answer_english || retrievedSchemeData.answer || 'I am sorry, I could not generate a response at this time.';
  }
}
