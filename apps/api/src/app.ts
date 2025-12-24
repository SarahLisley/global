import Fastify from 'fastify';
import cors from '@fastify/cors';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';

export function buildApp() {
  const app = Fastify({ logger: true });

  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowed.includes(origin) || origin.endsWith('.vercel.app'); // previews, opcional
      cb(null, ok);
    },
    credentials: true,
  });

  // Health leve (sem tocar Oracle)
  app.get('/health', async () => ({ ok: true }));

  // Rotas reais
  app.register(healthRoutes, { prefix: '/' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(dashboardRoutes, { prefix: '/dashboard' });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, 'Unhandled error');
    reply.code(500).send({ message: 'Internal error' });
  });

  return app;
}