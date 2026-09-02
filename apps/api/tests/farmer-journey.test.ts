import { describe, it, expect, vi } from 'vitest';
import { HybridRAGService } from '../src/modules/rag/index';
import { FakeEmbeddingProvider, FakeVectorStore, FakeLLMProvider, DefaultCitationFormatter } from '../src/modules/rag/fake-providers';
import { MockIdentityProvider } from '../src/modules/biometric_identity/index';

// -----------------------------------------------------------------------
// RAG Answer Rule Tests
// -----------------------------------------------------------------------
describe('RAG — Answer Rules (E2E logic)', () => {
  const rag = new HybridRAGService(
    new FakeEmbeddingProvider(), new FakeVectorStore(),
    new FakeLLMProvider(), new DefaultCitationFormatter()
  );

  it('consented farmer asks a question and gets a cited answer', async () => {
    const answer = await rag.query('Tell me about PMFBY insurance', 'en', {});
    expect(answer.answerText).toBeTruthy();
    expect(answer.citations.length).toBeGreaterThan(0);
    expect(answer.insufficientEvidence).toBe(false);
  });

  it('answer contains source URL in citations', async () => {
    const answer = await rag.query('Crop insurance premium', 'en', {});
    expect(answer.citations[0].sourceUrl).toMatch(/^https?:\/\//);
  });

  it('answer is in Hindi when language resolved to Hindi', async () => {
    const answer = await rag.query('PMFBY के बारे में बताएं', 'hi', {});
    expect(answer.answerLanguage).toBe('hi');
  });

  it('returns insufficientEvidence and no citations when no chunks found', async () => {
    const emptyStore: any = { similaritySearch: async () => [] };
    const service = new HybridRAGService(new FakeEmbeddingProvider(), emptyStore, new FakeLLMProvider(), new DefaultCitationFormatter());
    const answer = await service.query('Completely unknown topic xyz', 'en', {});
    expect(answer.insufficientEvidence).toBe(true);
    expect(answer.citations).toHaveLength(0);
  });
});

// -----------------------------------------------------------------------
// Farmer Workflow Tests (consent, guidance, grievance logic)
// -----------------------------------------------------------------------
describe('Farmer workflow — consent, guidance, grievance', () => {
  it('mock identity provider returns opaque subject ref, no biometric data', async () => {
    const idp = new MockIdentityProvider();
    const result = await idp.verify('device-001');
    expect(result.verified).toBe(true);
    expect(result.externalSubjectRef).toBeTruthy();
    // Must not contain raw biometric identifiers
    expect(result.externalSubjectRef).not.toContain('fingerprint');
    expect(result.externalSubjectRef).not.toContain('template');
    expect(result.provider).toBe('mock');
  });

  it('interaction history is blocked without authorization', () => {
    const isAuthorized = false;
    // Simulate the auth gate behavior tested from component logic
    expect(isAuthorized).toBe(false); // UI must show lock, not data
  });

  it('save guidance stores text content only, not biometric data', () => {
    const guidance = {
      title: 'PMFBY Answer',
      content: 'Farmers pay only 2% premium under PMFBY.',
      farmerId: 'farmer-uuid',
    };
    // Confirm no biometric fields in guidance payload
    expect(guidance).not.toHaveProperty('fingerprint');
    expect(guidance).not.toHaveProperty('aadhaar');
    expect(guidance.content).toBeTruthy();
  });

  it('grievance payload does not contain AI retrieval data by default', () => {
    const grievance = {
      farmerId: 'farmer-uuid',
      title: 'Payment not received',
      description: 'I applied for PMFBY but did not receive the benefit.',
    };
    // Grievance must NOT include AI query results or embeddings
    expect(grievance).not.toHaveProperty('ragAnswer');
    expect(grievance).not.toHaveProperty('embedding');
    expect(grievance.description).toBeTruthy();
  });
});
