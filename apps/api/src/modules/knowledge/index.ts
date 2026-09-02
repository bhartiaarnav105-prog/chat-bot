import { FastifyInstance } from 'fastify';
import { KnowledgeIngestionPipeline } from './pipeline';

export default async function (fastify: FastifyInstance) {
  const pipeline = new KnowledgeIngestionPipeline();

  // Upload or register an official source document
  fastify.post('/', async (request, reply) => {
    const { schemeVersionId, fileUrl, language, title } = request.body as any;
    
    // Process document through the knowledge ingestion pipeline
    const result = await pipeline.processDocument(schemeVersionId, fileUrl, language, title);
    
    return { success: true, data: result };
  });
}
