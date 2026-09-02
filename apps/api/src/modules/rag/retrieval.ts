import { db } from '../../db';
import { knowledgeChunks, knowledgeDocuments, schemeVersions } from '../../db/schema';
import { eq, and, sql, lte, or, isNull, gt } from 'drizzle-orm';

export async function getSearchableDocuments() {
  // STRICT VALIDATION: Only return chunks if their parent scheme version is:
  // 1. review_status = 'approved'
  // 2. effective_from <= NOW()
  // 3. effective_to IS NULL OR effective_to > NOW()

  const searchableChunks = await db
    .select({
      chunkId: knowledgeChunks.id,
      text: knowledgeChunks.chunkText,
      documentTitle: knowledgeDocuments.title,
      schemeVersionId: schemeVersions.id,
      reviewStatus: schemeVersions.reviewStatus
    })
    .from(knowledgeChunks)
    .innerJoin(knowledgeDocuments, eq(knowledgeChunks.documentId, knowledgeDocuments.id))
    .innerJoin(schemeVersions, eq(knowledgeDocuments.schemeVersionId, schemeVersions.id))
    .where(
      and(
        eq(schemeVersions.reviewStatus, 'approved'),
        lte(schemeVersions.effectiveFrom, sql`CURRENT_TIMESTAMP`),
        or(
          isNull(schemeVersions.effectiveTo),
          gt(schemeVersions.effectiveTo, sql`CURRENT_TIMESTAMP`)
        )
      )
    );

  return searchableChunks;
}
