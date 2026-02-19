import type { FastifyInstance } from 'fastify';
import { login, parseBearer, whoamiFromToken, getUserProfile } from '../controllers/authController';
import { LoginInputSchema } from '@pgb/sdk';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const result = LoginInputSchema.safeParse(req.body);

    if (!result.success) {
      return reply.code(400).send({
        message: 'Dados inválidos',
        errors: result.error.format()
      });
    }

    const { email, password } = result.data;
    const res = await login(email, password);

    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send(res.session);
  });

  app.post('/register', async (_req, reply) => {
    return reply.code(503).send({ message: 'Cadastro indisponível neste ambiente' });
  });

  app.get('/whoami', async (req, reply) => {
    const token = parseBearer(req.headers.authorization ?? null);
    const res = whoamiFromToken(token);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send(res.payload);
  });

  app.get('/me', async (req, reply) => {
    const token = parseBearer(req.headers.authorization ?? null);
    const auth = whoamiFromToken(token);
    if (!auth.ok) return reply.code(auth.status).send({ message: auth.message });

    const email = auth.payload?.sub;
    if (!email) return reply.code(400).send({ message: 'Token sem email (sub)' });

    const res = await getUserProfile(email);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send(res.profile);
  });
}