/**
 * AI/RAG Provider Interfaces for Sahakaar Sathi.
 *
 * Enforced rules:
 * - Answer in the dynamically detected / user-confirmed language only.
 * - Every factual claim must be cited from an approved source.
 * - Never use unapproved, expired, or geographically irrelevant sources.
 * - If evidence is insufficient, say so — never invent facts.
 * - Minimize farmer data sent to LLM. Never send biometric data.
 * - All provider keys are server-side only.
 */

/** A single retrieved knowledge chunk with its source metadata */
export interface RetrievedChunk {
  chunkId: string;
  chunkText: string;
  documentId: string;
  documentTitle: string;
  schemeVersionId: string;
  sourceUrl: string;
  language: string;
  similarity?: number; // cosine similarity score 0–1
}

/** Citation attached to a factual claim in the answer */
export interface Citation {
  documentTitle: string;
  sourceUrl: string;
  schemeVersionId: string;
  language: string;
}

/** Final answer returned to the farmer */
export interface RAGAnswer {
  /** Answer in the resolved language */
  answerText: string;
  /** Language the answer is written in */
  answerLanguage: string;
  /** Citations for every factual claim */
  citations: Citation[];
  /** True if the system lacked sufficient evidence and offered escalation */
  insufficientEvidence: boolean;
}

/** Filters applied during hybrid retrieval */
export interface RetrievalFilters {
  language?: string;
  state?: string;
  district?: string;
  schemeStatus?: 'approved';
  effectiveOnly?: boolean; // default true
}

/** Generates vector embeddings from text */
export interface EmbeddingProvider {
  embed(texts: string[]): Promise<number[][]>;
}

/** Stores and queries vectors */
export interface VectorStore {
  similaritySearch(
    queryEmbedding: number[],
    topK: number,
    filters: RetrievalFilters
  ): Promise<RetrievedChunk[]>;
}

/** Full hybrid RAG pipeline */
export interface RAGService {
  query(
    question: string,
    resolvedLanguage: string,
    filters: RetrievalFilters
  ): Promise<RAGAnswer>;
}

/** Calls the LLM to generate an answer from retrieved context */
export interface LLMProvider {
  generate(
    prompt: string,
    language: string
  ): Promise<string>;
}

/** Formats citations for display */
export interface CitationFormatter {
  format(chunks: RetrievedChunk[]): Citation[];
}
