import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { env } from './utils/env';

export function buildApp() {
  const app = Fastify({ logger: true });

  const allowed = (env.ALLOWED_ORIGINS ?? '').split(/[,\s]+/).filter(Boolean);
  app.register(cors, { origin: allowed.length ? allowed : true });

  app.register(healthRoutes, { prefix: '/' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(dashboardRoutes, { prefix: '/dashboard' }); 

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, 'Unhandled error');
    reply.code(500).send({ message: 'Internal error' });
  });

  return app;
}