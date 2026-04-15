import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import websocket from '@fastify/websocket';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import dashboardRoutes from './routes/dashboard.routes';
import ordersRoutes from './routes/orders.routes';
import sacRoutes from './routes/sac-tickets.routes';
import sacCommentsRoutes from './routes/sac-comments.routes';
import sacAttachmentsRoutes from './routes/sac-attachments.routes';
import sacNpsRoutes from './routes/sac-nps.routes';
import entregasRoutes from './routes/entregas.routes';
import financeiroRoutes from './routes/financeiro.routes';
import docsRoutes from './routes/docs.routes';
import notificationsRoutes from './routes/notifications.routes';
import avatarRoutes from './routes/avatar.routes';
import searchRoutes from './routes/search.routes';
import profileRoutes from './routes/profile.routes';
import websocketRoutes from './routes/websocket.routes';

export function buildApp(options: { https?: any } = {}) {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({ 
    logger: isProduction
      ? { level: 'warn' }  // produção: só erros e avisos
      : { level: 'info' }, // dev: informações normais sem verbosidade excessiva
    https: options.https
  } as any);

  // Security Headers nativos (sem biblioteca extra para evitar module not found)
  app.addHook('onRequest', (req, reply, done) => {
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'");
    done();
  });

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

  // Swagger Documentation — APENAS em desenvolvimento (não expor em produção)
  if (!isProduction) {
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
  }

  // WebSockets
  app.register(websocket);

  // Rotas
  app.register(healthRoutes, { prefix: '/' });
  app.register(authRoutes, { prefix: '/auth' });
  app.register(dashboardRoutes, { prefix: '/dashboard' });
  app.register(ordersRoutes, { prefix: '/orders' });
  app.register(sacRoutes, { prefix: '/sac' });
  app.register(sacCommentsRoutes, { prefix: '/sac' });
  app.register(sacAttachmentsRoutes, { prefix: '/sac' });
  app.register(sacNpsRoutes, { prefix: '/sac' });
  app.register(entregasRoutes, { prefix: '/entregas' });
  app.register(financeiroRoutes, { prefix: '/financeiro' });
  app.register(docsRoutes, { prefix: '/docs' });
  app.register(notificationsRoutes, { prefix: '/notifications' });
  app.register(avatarRoutes, { prefix: '/avatar' });

  app.register(searchRoutes, { prefix: '/search' });
  app.register(profileRoutes, { prefix: '/profile' });
  app.register(websocketRoutes, { prefix: '/ws' });

  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, 'Unhandled error');
    // Em produção, nunca expor detalhes internos do erro
    const message = isProduction ? 'Erro interno do servidor' : err.message;
    reply.code(500).send({ message });
  });

  return app;
}