import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const server: FastifyInstance = Fastify({
  logger: true
});

// Centralized error handler
server.setErrorHandler(function (error, request: FastifyRequest, reply: FastifyReply) {
  server.log.error(error);
  
  // Standardized error response format
  reply.status(error.statusCode || 500).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
      statusCode: error.statusCode || 500
    }
  });
});

import fastifyMultipart from '@fastify/multipart';
import assistantRoutes from './modules/assistant/routes';
import grievanceRoutes from './modules/grievances';
import knowledgeRoutes from './modules/knowledge';
import schemeRoutes from './modules/schemes';
import voiceRoutes from './modules/voice';

// API Versioning convention
server.register(async (apiV1) => {
  // Register multipart plugin to handle audio file uploads
  apiV1.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max audio file size
    }
  });

  // Health check endpoint
  apiV1.get('/health', async (request, reply) => {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'sahakaar-sathi-api',
        version: '1.0.0',
        readiness: {
          sttProvider: true,       // Mock STT configured
          llmProvider: true,       // Mock LLM configured
          embeddingProvider: true, // Mock Embedding configured
          vectorDatabase: true,    // Fake Vector DB available
          microphoneUi: true       // UI ready
        }
      }
    };
  });

  apiV1.get('/assistant', async () => ({
    success: true,
    data: {
      service: 'assistant',
      queryEndpoint: '/api/v1/assistant/query',
    },
  }));

  // Module routes
  apiV1.register(assistantRoutes);
  apiV1.register(schemeRoutes, { prefix: '/schemes' });
  apiV1.register(knowledgeRoutes, { prefix: '/knowledge-documents' });
  apiV1.register(grievanceRoutes, { prefix: '/grievances' });
  apiV1.register(voiceRoutes);

}, { prefix: '/api/v1' });

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

if (!process.env.VERCEL) {
  start();
}

export const config = {
  api: {
    bodyParser: false,
  },
};

let readyPromise: (FastifyInstance & PromiseLike<void>) | undefined;

export default async function handler(req: any, res: any) {
  readyPromise ??= server.ready();
  await readyPromise;
  server.server.emit('request', req, res);
}
