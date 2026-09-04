import { FastifyInstance } from 'fastify';
import { SarvamAIClient } from 'sarvamai';

export default async function voiceRoutes(apiV1: FastifyInstance) {
  /**
   * POST /api/v1/speech-to-text
   * 
   * Accepts a multipart audio file and forwards it to the Sarvam AI service.
   */
  apiV1.post('/speech-to-text', async (request, reply) => {
    try {
      if (!request.isMultipart()) {
        return reply.code(400).send({
          success: false,
          error: 'Audio file is required.',
        });
      }

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({
          success: false,
          error: 'Audio file is required.',
        });
      }

      if (!file.mimetype.startsWith('audio/') && !file.mimetype.startsWith('video/')) {
        return reply.code(400).send({
          success: false,
          error: `Invalid file type: ${file.mimetype}. Expected audio.`,
        });
      }

      const buffer = await file.toBuffer();
      if (buffer.length === 0) {
        return reply.code(400).send({
          success: false,
          error: 'Recorded audio is empty.',
        });
      }

      console.log(`[STT] Received file`);
      console.log(`[STT] Filename: ${file.filename}`);
      console.log(`[STT] Content-Type: ${file.mimetype}`);
      console.log(`[STT] Size: ${buffer.length} bytes`);

      // Language mapping
      let requestedLocale = 'en';
      if (file.fields && file.fields.language) {
        const langField = Array.isArray(file.fields.language) ? file.fields.language[0] : file.fields.language;
        if (langField && langField.type === 'field' && 'value' in langField) {
          requestedLocale = String(langField.value);
        }
      }
      
      let languageCode = 'en-IN';
      let mode: 'transcribe' | 'translate' | 'codemix' = 'transcribe';
      
      if (requestedLocale.startsWith('hi')) {
        languageCode = 'hi-IN';
        mode = 'codemix'; // Use codemix for Hindi/Hinglish
      } else if (requestedLocale.startsWith('mr')) {
        languageCode = 'mr-IN';
      } else if (requestedLocale.startsWith('gu')) {
        languageCode = 'gu-IN';
      } else if (requestedLocale.startsWith('bn')) {
        languageCode = 'bn-IN';
      }

      console.log(`[STT] Language: ${languageCode}`);
      console.log(`[STT] Mode: ${mode}`);
      console.log(`[STT] Model: saaras:v3`);
      console.log(`[STT] Sending audio to Sarvam`);

      // We instantiate the client using the environment variable
      const client = new SarvamAIClient({
        apiSubscriptionKey: process.env.SARVAM_API_KEY,
      });

      // We need a File object to pass to Sarvam SDK
      const blob = new Blob([new Uint8Array(buffer)], { type: file.mimetype });
      const audioFile = new File([blob], file.filename || 'recording.webm', { type: file.mimetype });

      const sarvamResponse = await client.speechToText.transcribe({
        file: audioFile,
        model: 'saaras:v3',
        languageCode: languageCode,
        mode: mode,
      } as any);

      console.log(`[STT] Sarvam response received`);
      console.log(`[STT] Sarvam response:`, JSON.stringify(sarvamResponse));

      if (!sarvamResponse || !sarvamResponse.transcript || sarvamResponse.transcript.trim() === '') {
        throw new Error('Sarvam returned an empty transcript.');
      }

      console.log(`[STT] Transcript: ${sarvamResponse.transcript}`);

      return {
        success: true,
        transcript: sarvamResponse.transcript,
        language: sarvamResponse.language_code || languageCode || 'en-IN',
      };
    } catch (error: any) {
      request.log.error(error);
      
      let errorMessage = error.message || 'Failed to transcribe audio.';
      let statusCode = 500;
      
      const errStatus = error?.status || error?.statusCode;

      if (errStatus === 403) {
        errorMessage = 'Sarvam API key is invalid or unauthorized.';
        statusCode = 403;
      } else if (errStatus === 429) {
        errorMessage = 'Sarvam rate limit or quota exceeded.';
        statusCode = 429;
      } else if (errStatus === 500 || errStatus === 503) {
        errorMessage = 'Sarvam service is temporarily unavailable.';
        statusCode = errStatus;
      } else if (errStatus === 422 || errStatus === 400) {
        errorMessage = 'Sarvam rejected the audio or request.';
        statusCode = errStatus;
      } else if (error.message === 'Sarvam returned an empty transcript.') {
        errorMessage = 'Sarvam returned an empty transcript.';
        statusCode = 400;
      }

      return reply.code(statusCode).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}
