import {
  EmbeddingProvider,
  VectorStore,
  LLMProvider,
  CitationFormatter,
  RetrievedChunk,
  Citation,
  RAGAnswer,
  RetrievalFilters,
} from './interfaces';

// ---------------------------------------------------------------------------
// Fake EmbeddingProvider — returns random vectors, no API key required
// ---------------------------------------------------------------------------
export class FakeEmbeddingProvider implements EmbeddingProvider {
  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(() =>
      Array.from({ length: 1536 }, () => Math.random() * 2 - 1)
    );
  }
}

// ---------------------------------------------------------------------------
// Fake VectorStore — returns pre-seeded mock chunks, no DB required
// ---------------------------------------------------------------------------
export class FakeVectorStore implements VectorStore {
  private chunks: RetrievedChunk[] = [
    {
      chunkId: 'chunk-001',
      chunkText: 'PMFBY provides crop insurance coverage for Kharif crops up to ₹15,000 per hectare.',
      documentId: 'doc-001',
      documentTitle: 'PMFBY Guidelines 2024',
      schemeVersionId: 'sv-001',
      sourceUrl: 'https://pmfby.gov.in/guidelines2024',
      language: 'en',
      similarity: 0.92,
    },
    {
      chunkId: 'chunk-002',
      chunkText: 'किसानों को प्रधान मंत्री फसल बीमा योजना के तहत प्रीमियम का केवल 2% देना होगा।',
      documentId: 'doc-002',
      documentTitle: 'PMFBY दिशानिर्देश 2024',
      schemeVersionId: 'sv-002',
      sourceUrl: 'https://pmfby.gov.in/guidelines2024-hi',
      language: 'hi',
      similarity: 0.88,
    },
  ];

  async similaritySearch(
    _queryEmbedding: number[],
    topK: number,
    filters: RetrievalFilters
  ): Promise<RetrievedChunk[]> {
    let results = [...this.chunks];

    // Apply language filter
    if (filters.language) {
      results = results.filter(c => c.language === filters.language);
      // fallback to English if no results in language
      if (results.length === 0) {
        results = this.chunks.filter(c => c.language === 'en');
      }
    }

    return results.slice(0, topK);
  }
}

// ---------------------------------------------------------------------------
// Fake LLMProvider — returns a template answer, no API key required
// ---------------------------------------------------------------------------
export class FakeLLMProvider implements LLMProvider {
  async generate(prompt: string, language: string): Promise<string> {
    // Return language-tagged canned response
    if (language === 'hi') {
      return 'PMFBY के तहत खरीफ फसलों के लिए बीमा उपलब्ध है। किसानों को मात्र 2% प्रीमियम देना होगा।';
    }
    return 'Under PMFBY, crop insurance is available for Kharif crops. Farmers pay only 2% premium.';
  }
}

// ---------------------------------------------------------------------------
// CitationFormatter — converts retrieved chunks into citation objects
// ---------------------------------------------------------------------------
export class DefaultCitationFormatter implements CitationFormatter {
  format(chunks: RetrievedChunk[]): Citation[] {
    return chunks.map(c => ({
      documentTitle: c.documentTitle,
      sourceUrl: c.sourceUrl,
      schemeVersionId: c.schemeVersionId,
      language: c.language,
    }));
  }
}
