import type { FastifyInstance } from 'fastify';
import { login, parseBearer, whoamiFromToken, listDevUsers } from '../controllers/authController';

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', async (req, reply) => {
    const body = (req.body ?? {}) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return reply.code(400).send({ message: 'email e password são obrigatórios' });
    }
    const res = await login(body.email, body.password);
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

  app.get('/dev/users', async (_req, reply) => {
    const res = await listDevUsers(5);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ users: res.users });
  });
}