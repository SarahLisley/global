import type { FastifyInstance } from 'fastify';
import { parseBearer, whoamiFromToken, updateProfile, updatePassword, getUserProfile } from '../controllers/authController';
import { z } from 'zod';

const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
});

export default async function profileRoutes(app: FastifyInstance) {
  
  // Middleware simples para garantir que o usuário está logado em todas as rotas de perfil
  app.addHook('preHandler', async (req, reply) => {
    const token = parseBearer(req.headers.authorization ?? null);
    const auth = whoamiFromToken(token);
    if (!auth.ok) return reply.code(auth.status).send({ message: auth.message });
    (req as any).user = auth.payload;
  });

  app.get('/', async (req, reply) => {
    const email = (req as any).user.sub;
    const res = await getUserProfile(email);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send(res.profile);
  });

  app.patch('/', async (req, reply) => {
    const email = (req as any).user.sub;
    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message });

    const res = await updateProfile(email, parsed.data.name);
    return reply.code(res.status).send(res);
  });

  app.patch('/password', async (req, reply) => {
    const email = (req as any).user.sub;
    const parsed = UpdatePasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message });

    const { currentPassword, newPassword } = parsed.data;
    const res = await updatePassword(email, currentPassword, newPassword);
    return reply.code(res.status).send(res);
  });
}
