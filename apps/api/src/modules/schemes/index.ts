import { FastifyInstance } from 'fastify';
import { db } from '../../db';
import { schemes, schemeVersions } from '../../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export default async function (fastify: FastifyInstance) {
  // 1. Create a base scheme
  fastify.post('/', async (request, reply) => {
    const { title, category } = request.body as any;
    
    const [scheme] = await db.insert(schemes).values({
      title,
      category,
    }).returning();
    
    return { success: true, data: scheme };
  });

  // 2. Create an immutable scheme version
  fastify.post('/:id/versions', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { sourceUrl, effectiveFrom, effectiveTo, geography, eligibilityRules } = request.body as any;
    
    // Simulate checksum generation for the source document
    const checksum = crypto.createHash('sha256').update(sourceUrl + Date.now().toString()).digest('hex');

    const [version] = await db.insert(schemeVersions).values({
      schemeId: id,
      sourceUrl,
      effectiveFrom: new Date(effectiveFrom),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      geography,
      checksum,
      reviewStatus: 'pending',
    }).returning();
    
    // Note: eligibilityRules would be inserted into eligibility_rules table here in a transaction
    
    return { success: true, data: version };
  });

  // 3. Review a scheme version (Approve, Reject, Expire)
  fastify.post('/versions/:versionId/review', async (request, reply) => {
    const { versionId } = request.params as { versionId: string };
    const { reviewStatus, reviewerId } = request.body as { reviewStatus: 'approved' | 'rejected' | 'expired', reviewerId: string };
    
    const [updatedVersion] = await db.update(schemeVersions)
      .set({ 
        reviewStatus,
        reviewerId 
      })
      .where(eq(schemeVersions.id, versionId))
      .returning();
      
    return { success: true, data: updatedVersion };
  });
}
