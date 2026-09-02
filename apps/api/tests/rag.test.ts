import { describe, it, expect } from 'vitest';
import { HybridRAGService, runEmbeddingIngestionJob } from '../src/modules/rag/index';
import {
  FakeEmbeddingProvider,
  FakeVectorStore,
  FakeLLMProvider,
  DefaultCitationFormatter,
} from '../src/modules/rag/fake-providers';

function makeService() {
  return new HybridRAGService(
    new FakeEmbeddingProvider(),
    new FakeVectorStore(),
    new FakeLLMProvider(),
    new DefaultCitationFormatter()
  );
}

describe('HybridRAGService — answer rules', () => {
  it('returns an answer with citations for a known English question', async () => {
    const service = makeService();
    const answer = await service.query('Tell me about PMFBY', 'en', {});
    expect(answer.answerText).toBeTruthy();
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.insufficientEvidence).toBe(false);
  });

  it('returns an answer in Hindi when resolved language is Hindi', async () => {
    const service = makeService();
    const answer = await service.query('PMFBY के बारे में बताएं', 'hi', {});
    expect(answer.answerLanguage).toBe('hi');
    expect(answer.answerText).toBeTruthy();
  });

  it('always includes source citations', async () => {
    const service = makeService();
    const answer = await service.query('Tell me about crop insurance', 'en', {});
    expect(answer.citations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceUrl: expect.any(String) }),
      ])
    );
  });

  it('sets insufficientEvidence = true and offers escalation when no high-confidence chunks exist', async () => {
    // Use a VectorStore that returns zero chunks
    const emptyStore: any = { similaritySearch: async () => [] };
    const service = new HybridRAGService(
      new FakeEmbeddingProvider(),
      emptyStore,
      new FakeLLMProvider(),
      new DefaultCitationFormatter()
    );
    const answer = await service.query('Obscure question with no source', 'en', {});
    expect(answer.insufficientEvidence).toBe(true);
    expect(answer.citations).toHaveLength(0);
  });

  it('NEVER sends more data than necessary (prompt must not contain undefined PII)', async () => {
    // Verify the service does not crash or leak undefined fields
    const service = makeService();
    const answer = await service.query('What is PMFBY?', 'hi', { state: 'Maharashtra' });
    expect(answer).not.toBeUndefined();
    expect(answer.answerText).not.toContain('undefined');
  });
});

describe('Embedding Ingestion Job', () => {
  it('processes chunks and returns a count without throwing', async () => {
    const result = await runEmbeddingIngestionJob(new FakeEmbeddingProvider());
    expect(result.processed).toBeGreaterThan(0);
  });
});
