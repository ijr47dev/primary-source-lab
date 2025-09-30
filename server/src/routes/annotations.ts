import { FastifyInstance } from 'fastify';
import { prisma } from '../index';

interface CreateAnnotationBody {
  documentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color?: string;
  category?: string;
  author?: string;
}

interface UpdateAnnotationBody {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  category?: string;
}

export default async function annotationRoutes(fastify: FastifyInstance) {
  // Create annotation
  fastify.post<{ Body: CreateAnnotationBody }>('/', async (request, reply) => {
    try {
      const annotation = await prisma.annotation.create({
        data: request.body
      });
      
      return reply.code(201).send(annotation);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create annotation' });
    }
  });

  // Update annotation
  fastify.patch<{ 
    Params: { id: string }, 
    Body: UpdateAnnotationBody 
  }>('/:id', async (request, reply) => {
    const { id } = request.params;
    
    try {
      const annotation = await prisma.annotation.update({
        where: { id },
        data: request.body
      });
      
      return annotation;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to update annotation' });
    }
  });

  // Delete annotation
  fastify.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    
    try {
      await prisma.annotation.delete({
        where: { id }
      });
      
      return reply.code(204).send();
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to delete annotation' });
    }
  });

  // Bulk create/update annotations
  fastify.post<{ Body: { documentId: string, annotations: any[] } }>('/bulk', async (request, reply) => {
    const { documentId, annotations } = request.body;
    
    try {
      // Delete existing and create new (simple sync strategy)
      await prisma.annotation.deleteMany({
        where: { documentId }
      });
      
      const created = await prisma.annotation.createMany({
        data: annotations.map(a => ({
          ...a,
          documentId
        }))
      });
      
      return { count: created.count };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to sync annotations' });
    }
  });
}