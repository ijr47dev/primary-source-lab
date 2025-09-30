import { FastifyInstance } from 'fastify';
import { prisma } from '../index';
import { v4 as uuidv4 } from 'uuid';

interface CreateDocumentBody {
  title: string;
  description?: string;
  imageUrl: string;
}

interface GetDocumentParams {
  shareToken: string;
}

export default async function documentRoutes(fastify: FastifyInstance) {
  // Create new document
  fastify.post<{ Body: CreateDocumentBody }>('/', async (request, reply) => {
    const { title, description, imageUrl } = request.body;
    
    try {
      const document = await prisma.document.create({
        data: {
          title,
          description,
          imageUrl,
          shareToken: uuidv4()
        },
        include: {
          annotations: true
        }
      });
      
      return reply.code(201).send(document);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to create document' });
    }
  });

  // Get document by share token
  fastify.get<{ Params: GetDocumentParams }>('/:shareToken', async (request, reply) => {
    const { shareToken } = request.params;
    
    try {
      const document = await prisma.document.findUnique({
        where: { shareToken },
        include: {
          annotations: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      
      if (!document) {
        return reply.code(404).send({ error: 'Document not found' });
      }
      
      return document;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to fetch document' });
    }
  });

  // Upload image endpoint
  fastify.post('/upload', async (request, reply) => {
    const data = await request.file();
    
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }
    
    // For now, we'll return a data URL
    // In production, upload to Cloudinary or S3
    const buffer = await data.toBuffer();
    const base64 = buffer.toString('base64');
    const mimeType = data.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    return { imageUrl: dataUrl };
  });
}