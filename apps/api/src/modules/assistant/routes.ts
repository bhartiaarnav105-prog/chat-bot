import { FastifyInstance } from 'fastify';
import { HybridRAGService } from '../rag';
import { MockLanguageDetector, MockSpeechToTextProvider } from '../language/mock-providers';

const ragService = new HybridRAGService();
const sttProvider = new MockSpeechToTextProvider();
const languageDetector = new MockLanguageDetector();

export default async function assistantRoutes(apiV1: FastifyInstance) {
  apiV1.post('/assistant/query', async (request, reply) => {
    try {
      // 1. Check if the request is multipart
      if (!request.isMultipart()) {
        const body = request.body as any;
        if (body && body.question) {
          // Handle text-only request (fallback)
          const lang = body.language || 'en';
          const answer = await ragService.query(body.question, lang, {
            state: body.state,
            district: body.district
          });
          return { success: true, data: answer };
        }
        return reply.code(400).send({ success: false, error: 'Request is not multipart or missing question field' });
      }

      // 2. Process multipart upload
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ success: false, error: 'No audio file uploaded' });
      }

      // Validate mimetype (e.g. audio/webm, audio/mp4, audio/ogg)
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
      let resolvedLanguage = 'en';
      let requiresConfirmation = false;
      let confidence = 1.0;

      // Ensure STT provider is available
      if (!sttProvider) {
        return reply.code(503).send({ success: false, error: 'Speech provider is not configured' });
      }

      // Convert Node Buffer to ArrayBuffer
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

      const transcriptResult = await sttProvider.transcribe(arrayBuffer, overrideLanguage);
      transcriptText = transcriptResult.originalTranscript;

      if (overrideLanguage) {
        resolvedLanguage = overrideLanguage;
      } else {
        const detection = await languageDetector.detectFromText(transcriptText);
        resolvedLanguage = detection.detectedLanguage;
        requiresConfirmation = detection.requiresConfirmation;
        confidence = detection.confidence;
      }

      // 5. If language confidence is low, return early for confirmation
      if (requiresConfirmation) {
        return {
          success: true,
          data: {
            transcript: transcriptText,
            detectedLanguage: resolvedLanguage,
            confidence,
            requiresConfirmation: true,
            // Provide a mock answer state just in case, but frontend should block
            answerText: null,
            citations: [],
            insufficientEvidence: false
          }
        };
      }

      // 6. RAG query
      const ragAnswer = await ragService.query(transcriptText, resolvedLanguage, {
        language: resolvedLanguage,
        // In real app, we'd fetch farmer profile by farmerId to get state/district
      });

      // 7. Return complete payload
      return {
        success: true,
        data: {
          transcript: transcriptText,
          detectedLanguage: resolvedLanguage,
          confidence,
          requiresConfirmation: false,
          answerText: ragAnswer.answerText,
          citations: ragAnswer.citations,
          insufficientEvidence: ragAnswer.insufficientEvidence
        }
      };

    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({ success: false, error: 'Internal server error processing audio' });
    }
  });
}
