import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import ordersRoutes from './routes/orders.routes';
import sacRoutes from './routes/sac-tickets.routes';
import entregasRoutes from './routes/entregas.routes';
import financeiroRoutes from './routes/financeiro.routes';
import docsRoutes from './routes/docs.routes';
import notificationsRoutes from './routes/notifications.routes';
import avatarRoutes from './routes/avatar.routes';
import searchRoutes from './routes/search.routes';

export function buildApp() {
  const app = Fastify({ logger: true });

  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  // Adiciona FRONTEND_URL se configurado
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (frontendUrl && !allowed.includes(frontendUrl)) {
    allowed.push(frontendUrl);
  }

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowed.includes(origin);
      cb(null, ok);
    },
    credentials: true,
  });

  // Upload de arquivos (multipart)
  app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });

  // Rate limiting global (proteção contra abuso)
  app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Swagger Documentation
  app.register(swagger, {
    openapi: {
      info: {
        title: 'Portal Global Bravo System API',
        description: 'Documentação interativa das rotas.',
        version: '1.0.0'
      },
      servers: [{ url: 'http://localhost:4001', description: 'Development Server' }],
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
        }
      }
    }
  });
  app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: { docExpansion: 'list', deepLinking: false }
  });

  // Rotas
  app.register(healthRoutes, { prefix: '/' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(dashboardRoutes, { prefix: '/dashboard' });
  app.register(ordersRoutes, { prefix: '/orders' });
  app.register(sacRoutes, { prefix: '/sac' });
  app.register(entregasRoutes, { prefix: '/entregas' });
  app.register(financeiroRoutes, { prefix: '/financeiro' });
  app.register(docsRoutes, { prefix: '/docs' });
  app.register(notificationsRoutes, { prefix: '/notifications' });
  app.register(avatarRoutes, { prefix: '/avatar' });

  app.register(searchRoutes, { prefix: '/search' });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, 'Unhandled error');
    reply.code(500).send({ message: 'Internal error' });
  });

  return app;
}