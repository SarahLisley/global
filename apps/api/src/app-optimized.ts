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

export function buildAppOptimized(options: { https?: any } = {}) {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({ 
    logger: {
      level: isProduction ? 'warn' : 'info',
      transport: isProduction ? undefined : {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    },
    https: options.https,
    // Otimizações de performance
    bodyLimit: 10 * 1024 * 1024, // 10MB
    keepAliveTimeout: 65000, // 65s
    requestTimeout: 30000, // 30s
    connectionTimeout: 10000, // 10s
    maxParamLength: 200,
    trustProxy: true,
  } as any);

  // Security Headers otimizados
  app.addHook('onRequest', (req, reply, done) => {
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-Content-Type-Options', 'nosniff');
    if (isProduction) {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    reply.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'");
    done();
  });

  const allowed = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const frontendUrl = process.env.FRONTEND_URL?.trim();
  if (frontendUrl && !allowed.includes(frontendUrl)) {
    allowed.push(frontendUrl);
  }

  // CORS otimizado
  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const ok = allowed.includes(origin);
      cb(null, ok);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    maxAge: 86400, // 24h cache preflight
  });

  // Upload otimizado
  app.register(multipart, { 
    limits: { 
      fileSize: 2 * 1024 * 1024,
      files: 5,
      fields: 20
    },
    attachFieldsToBody: false,
    preservePath: false,
  });

  // Rate limiting otimizado
  app.register(rateLimit, {
    max: isProduction ? 200 : 100,
    timeWindow: '1 minute',
    cache: 10000,
    skipOnError: false,
  });

  // Swagger apenas em dev
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

  // Rotas com prefixos otimizados
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

  // Error handler otimizado
  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, 'Unhandled error');
    const message = isProduction ? 'Erro interno do servidor' : err.message;
    reply.code(500).send({ message });
  });

  // Hook de performance para logging
  app.addHook('onRequest', (req, reply, done) => {
    (req as any).startTime = Date.now();
    done();
  });

  app.addHook('onResponse', (req, reply, done) => {
    const duration = Date.now() - (req as any).startTime;
    if (duration > 1000) { // Log apenas requisições lentas
      app.log.warn({
        method: req.method,
        url: req.url,
        statusCode: reply.statusCode,
        duration: `${duration}ms`
      }, 'Slow request');
    }
    done();
  });

  return app;
}
