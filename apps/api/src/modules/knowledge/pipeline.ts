import { db } from '../../db';
import { knowledgeDocuments, knowledgeChunks } from '../../db/schema';

// Pipeline Interfaces
export interface DocumentExtractor {
  extractText(fileUrl: string): Promise<string>;
}

export interface TextChunker {
  chunkText(text: string): string[];
}

export interface EmbeddingJob {
  scheduleEmbedding(chunkIds: string[]): Promise<void>;
}

// Mock Implementations for Phase 3
class MockExtractor implements DocumentExtractor {
  async extractText(fileUrl: string): Promise<string> {
    console.log(`Extracting text from ${fileUrl}...`);
    return `Mock extracted text from ${fileUrl}. This document explains scheme benefits.`;
  }
}

class MockChunker implements TextChunker {
  chunkText(text: string): string[] {
    console.log(`Chunking text...`);
    // Basic mock: split by sentences
    return text.split('. ').map(s => s.trim()).filter(Boolean);
  }
}

class MockEmbeddingJob implements EmbeddingJob {
  async scheduleEmbedding(chunkIds: string[]): Promise<void> {
    console.log(`[PIPELINE] Skipping actual LLM embedding for ${chunkIds.length} chunks as per Phase 3 constraints.`);
    // Future: queue job to generate vectors and update knowledge_chunks
  }
}

export class KnowledgeIngestionPipeline {
  constructor(
    private extractor: DocumentExtractor = new MockExtractor(),
    private chunker: TextChunker = new MockChunker(),
    private embeddingJob: EmbeddingJob = new MockEmbeddingJob()
  ) {}

  async processDocument(schemeVersionId: string, fileUrl: string, language: string, title: string) {
    // 1. Record document
    const [document] = await db.insert(knowledgeDocuments).values({
      schemeVersionId,
      title,
      language
    }).returning();

    // 2. Extract text
    const fullText = await this.extractor.extractText(fileUrl);

    // 3. Chunk text
    const chunks = this.chunker.chunkText(fullText);

    // 4. Save chunks with empty vectors (embeddings done later)
    const savedChunks = await db.insert(knowledgeChunks).values(
      chunks.map((chunk, index) => ({
        documentId: document.id,
        chunkText: chunk,
        pageNumber: 1,
      }))
    ).returning();

    // 5. Schedule embedding generation
    await this.embeddingJob.scheduleEmbedding(savedChunks.map(c => c.id));

    return { document, chunksCount: savedChunks.length };
  }
}
