import { FastifyInstance } from 'fastify';
import { MockSpeechToTextProvider } from '../language/mock-providers';
import { searchSchemes } from '../schemes/schemeSearch';
import { detectLanguage, adaptResponse, LanguageDetectionResult } from '../ai/languageAdaptation';

const sttProvider = new MockSpeechToTextProvider();

async function generateFactualResponse(matchedSchemes: any[], originalQuestion: string, detectedLanguage: LanguageDetectionResult) {
  if (matchedSchemes.length === 0) {
    return {
      success: true,
      answerText: detectedLanguage.language === 'Hindi' 
        ? 'मुझे आपके अनुरोध के लिए उपलब्ध योजना डेटाबेस में कोई निकटतम मिलान वाली सरकारी योजना नहीं मिली। कृपया विस्तार से बताएं कि आपको किस प्रकार की सहायता की आवश्यकता है।'
        : 'I could not find a relevant government scheme for your question.',
      schemes: []
    };
  }

  const topMatch = matchedSchemes[0];
  const topScheme = topMatch.scheme;
  
  // Construct factual payload
  const factualPayload: any = {
    scheme_name: topScheme.scheme_name,
    category: topScheme.category,
    target_beneficiary: topScheme.target_beneficiary,
    state_or_central: topScheme.state_or_central,
    launched_year: topScheme.launched_year,
    official_website: topScheme.official_website,
  };

  // Select the best source question/answer based on the language
  let sourceLang = 'English & Hindi';
  if (detectedLanguage.language === 'English') {
    factualPayload.question_english = topScheme.question_english;
    factualPayload.answer_english = topScheme.answer_english;
    sourceLang = 'English';
  } else if (detectedLanguage.language === 'Hindi') {
    factualPayload.question = topScheme.question;
    factualPayload.answer = topScheme.answer;
    sourceLang = 'Hindi';
  } else {
    // For other languages, give both to let Gemini choose the best translation source
    factualPayload.question_english = topScheme.question_english;
    factualPayload.answer_english = topScheme.answer_english;
    factualPayload.question = topScheme.question;
    factualPayload.answer = topScheme.answer;
  }

  console.log(`\n[RESPONSE GENERATION]`);
  console.log(`source language: ${sourceLang}`);
  console.log(`target language: ${detectedLanguage.fullDescription}`);
  console.log(`scheme: ${topScheme.scheme_name}`);

  const answerText = await adaptResponse(originalQuestion, detectedLanguage, factualPayload);

  console.log(`\n[LANGUAGE ADAPTATION]`);
  console.log(`completed: true`);
  console.log(`target: ${detectedLanguage.fullDescription}`);

  const mappedSchemes = matchedSchemes.map(m => ({
    scheme_name: m.scheme.scheme_name,
    category: m.scheme.category,
    target_beneficiary: m.scheme.target_beneficiary,
    official_website: m.scheme.official_website,
    state_or_central: m.scheme.state_or_central,
    score: m.score
  }));
  
  return {
    success: true,
    answerText: answerText,
    schemes: mappedSchemes,
    debug: {
      totalCandidates: matchedSchemes.length,
      matchedSchemes: matchedSchemes.length
    }
  };
}

export default async function assistantRoutes(apiV1: FastifyInstance) {
  apiV1.post('/assistant/query', async (request, reply) => {
    console.log('[ASSISTANT] Query received');
    try {
      // 1. Check if the request is multipart
      if (!request.isMultipart()) {
        const body = request.body as any;
        if (body && body.question) {
          // Handle text-only request
          const detectedLanguage = await detectLanguage(body.question);
          
          console.log(`\n[LANGUAGE DETECTED]`);
          console.log(`language: ${detectedLanguage.language}`);
          console.log(`script/style: ${detectedLanguage.scriptStyle}`);
          
          const matchedSchemes = await searchSchemes(body.question);
          const answer = await generateFactualResponse(matchedSchemes, body.question, detectedLanguage);
          
          return {
            success: true,
            transcript: body.question,
            detectedLanguage: detectedLanguage.language,
            confidence: 1.0,
            requiresConfirmation: false,
            answerText: answer.answerText,
            schemes: answer.schemes,
            debug: answer.debug,
            insufficientEvidence: answer.schemes.length === 0
          };
        }
        return reply.code(400).send({ success: false, error: 'Request is not multipart or missing question field' });
      }

      // 2. Process multipart upload
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ success: false, error: 'No audio file uploaded' });
      }

      // Validate mimetype
      if (!data.mimetype.startsWith('audio/')) {
        return reply.code(400).send({ success: false, error: `Invalid file type: ${data.mimetype}. Expected audio.` });
      }

      // 3. Buffer the audio stream
      const buffer = await data.toBuffer();
      
      // Extract optional form fields
      const overrideLanguage = data.fields.language ? (data.fields.language as any).value : undefined;
      const farmerId = data.fields.farmerId ? (data.fields.farmerId as any).value : undefined;

      // 4. Perform STT & Language Detection
      let transcriptText = '';
      
      if (!sttProvider) {
        return reply.code(503).send({ success: false, error: 'Speech provider is not configured' });
      }

      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

      const transcriptResult = await sttProvider.transcribe(arrayBuffer, overrideLanguage);
      transcriptText = transcriptResult.originalTranscript;

      const detectedLanguage = await detectLanguage(transcriptText);
      console.log(`\n[LANGUAGE DETECTED]`);
      console.log(`language: ${detectedLanguage.language}`);
      console.log(`script/style: ${detectedLanguage.scriptStyle}`);

      let resolvedLanguage = detectedLanguage;
      if (overrideLanguage) {
        resolvedLanguage = {
          language: overrideLanguage,
          scriptStyle: 'Unknown',
          fullDescription: overrideLanguage
        };
      }

      let requiresConfirmation = false;
      let confidence = 1.0;

      // 6. Search schemes using text
      const matchedSchemes = await searchSchemes(transcriptText);
      const answerInfo = await generateFactualResponse(matchedSchemes, transcriptText, resolvedLanguage);

      // 7. Return complete payload
      return {
        success: true,
        transcript: transcriptText,
        detectedLanguage: resolvedLanguage.language,
        confidence,
        requiresConfirmation: false,
        answerText: answerInfo.answerText,
        schemes: answerInfo.schemes,
        debug: answerInfo.debug,
        insufficientEvidence: answerInfo.schemes.length === 0
      };

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false, error: 'Internal server error processing query' });
    }
  });
}
