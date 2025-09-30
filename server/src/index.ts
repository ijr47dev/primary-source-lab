import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { PrismaClient } from '@prisma/client';

const fastify = Fastify({
  logger: true
});

export const prisma = new PrismaClient();

const start = async () => {
  try {
    // Register plugins ONCE
    await fastify.register(cors, {
      origin: true,
      credentials: true
    });
    
    await fastify.register(multipart, {
      limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
      }
    });

    // Import routes AFTER plugins are registered
    const documentRoutes = await import('./routes/documents');
    const annotationRoutes = await import('./routes/annotations');

    // Register routes
    await fastify.register(documentRoutes.default, { prefix: '/api/documents' });
    await fastify.register(annotationRoutes.default, { prefix: '/api/annotations' });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    const port = process.env.PORT || 3001;
    await fastify.listen({ port: Number(port), host: '0.0.0.0' });
    
    console.log(`Server running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Cleanup on exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();