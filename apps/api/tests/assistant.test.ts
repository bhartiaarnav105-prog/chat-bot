import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import fastifyMultipart from '@fastify/multipart';
import assistantRoutes from '../src/modules/assistant/routes';

describe('Assistant Query Endpoint', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify();
    await app.register(fastifyMultipart);
    await app.register(assistantRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject non-multipart requests without a question', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assistant/query',
      payload: {}
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
  });

  it('should process a text-only query gracefully (fallback)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/assistant/query',
      payload: { question: 'What is PMFBY?', language: 'en' }
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.answerText).toBeDefined();
  });
});
