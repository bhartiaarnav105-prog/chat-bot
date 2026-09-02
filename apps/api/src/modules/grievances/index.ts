import { FastifyInstance } from 'fastify';
import { db } from '../../db';
import { grievances } from '../../db/schema';

interface CreateGrievanceBody {
  farmerId: string;
  title: string;
  description: string;
  serviceCentreId?: string;
}

export default async function grievanceRoutes(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateGrievanceBody }>('/', async (request, reply) => {
    const { farmerId, title, description, serviceCentreId } = request.body;

    if (!farmerId || !title?.trim() || !description?.trim()) {
      return reply.code(400).send({
        success: false,
        error: 'farmerId, title, and description are required',
      });
    }

    const [grievance] = await db.insert(grievances).values({
      farmerId,
      title: title.trim(),
      description: description.trim(),
      serviceCentreId,
    }).returning();

    return reply.code(201).send({ success: true, data: grievance });
  });
}
