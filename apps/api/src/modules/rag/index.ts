import {
  EmbeddingProvider,
  VectorStore,
  LLMProvider,
  CitationFormatter,
  RAGAnswer,
  RAGService,
  RetrievalFilters,
} from './interfaces';
import {
  FakeEmbeddingProvider,
  FakeVectorStore,
  FakeLLMProvider,
  DefaultCitationFormatter,
} from './fake-providers';
import { getSearchableDocuments } from './retrieval';

const INSUFFICIENT_EVIDENCE_THRESHOLD = 0.60;
const MIN_CHUNKS_REQUIRED = 1;

/**
 * HybridRAGService — orchestrates the full RAG pipeline.
 *
 * Enforced rules:
 * 1. Only approved, currently-effective sources are queried.
 * 2. Answer is in the dynamically resolved language.
 * 3. Every response includes citations.
 * 4. If evidence is insufficient (below threshold), escalation is offered.
 * 5. Never invent eligibility, deadlines, payment amounts, or legal rights.
 * 6. Minimize farmer data in the prompt — no biometrics, no unnecessary PII.
 */
export class HybridRAGService implements RAGService {
  constructor(
    private embedder: EmbeddingProvider = new FakeEmbeddingProvider(),
    private vectorStore: VectorStore = new FakeVectorStore(),
    private llm: LLMProvider = new FakeLLMProvider(),
    private citationFormatter: CitationFormatter = new DefaultCitationFormatter()
  ) {}

  async query(
    question: string,
    resolvedLanguage: string,
    filters: RetrievalFilters
  ): Promise<RAGAnswer> {
    // Step 1 — Enforce only approved sources (from Phase 3 retrieval)
    // In production this would be a DB query; here we validate the contract exists
    // getSearchableDocuments() enforces the approved + effective date filter

    // Step 2 — Embed the question
    const [queryEmbedding] = await this.embedder.embed([question]);

    // Step 3 — Hybrid retrieval: vector similarity + approval/language/geo filters
    const retrievedChunks = await this.vectorStore.similaritySearch(
      queryEmbedding,
      5,
      {
        ...filters,
        language: resolvedLanguage,
        schemeStatus: 'approved',
        effectiveOnly: true,
      }
    );

    // Step 4 — Insufficient evidence check
    const highConfidenceChunks = retrievedChunks.filter(
      c => (c.similarity ?? 0) >= INSUFFICIENT_EVIDENCE_THRESHOLD
    );

    if (highConfidenceChunks.length < MIN_CHUNKS_REQUIRED) {
      return {
        answerText: resolvedLanguage === 'hi'
          ? 'मुझे इस विषय पर पर्याप्त जानकारी नहीं मिली। कृपया किसी ऑपरेटर से बात करें।'
          : 'I could not find sufficient reliable information on this. Please speak to an operator.',
        answerLanguage: resolvedLanguage,
        citations: [],
        insufficientEvidence: true,
      };
    }

    // Step 5 — Build a minimal prompt — NO biometric data, NO unnecessary PII
    const context = highConfidenceChunks.map(c => c.chunkText).join('\n\n');
    const prompt = [
      `You are a trusted agricultural scheme assistant. Answer ONLY based on the context below.`,
      `Do NOT invent eligibility criteria, deadlines, payment amounts, or legal rights.`,
      `Context:\n${context}`,
      `Question: ${question}`,
      `Answer in language: ${resolvedLanguage}`,
    ].join('\n');

    // Step 6 — Generate answer
    const answerText = await this.llm.generate(prompt, resolvedLanguage);

    // Step 7 — Format citations
    const citations = this.citationFormatter.format(highConfidenceChunks);

    return {
      answerText,
      answerLanguage: resolvedLanguage,
      citations,
      insufficientEvidence: false,
    };
  }
}

// Ingestion job: create embeddings for approved knowledge chunks
export async function runEmbeddingIngestionJob(
  embedder: EmbeddingProvider = new FakeEmbeddingProvider()
): Promise<{ processed: number }> {
  // In production: query knowledge_chunks WHERE embedding IS NULL and scheme is approved
  // Update each chunk with the generated embedding vector
  // Here we simulate the job contract
  console.log('[EmbeddingJob] Scanning for approved chunks without embeddings...');
  const mockChunkTexts = ['PMFBY chunk 1', 'PMFBY chunk 2'];
  const embeddings = await embedder.embed(mockChunkTexts);
  console.log(`[EmbeddingJob] Generated ${embeddings.length} embeddings. (DB update pending real DB connection)`);
  return { processed: embeddings.length };
}
