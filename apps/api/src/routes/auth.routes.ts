import type { FastifyInstance } from 'fastify';
import { login, parseBearer, whoamiFromToken, getUserProfile, forgotPassword, resetPassword, registerUser, completeRegistration, resendRegistrationCode } from '../controllers/authController';
import { LoginInputSchema } from '@pgb/sdk';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1, { message: 'Token é obrigatório' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const RegisterSchema = z.object({
  cnpj: z.string().min(11, { message: 'CNPJ inválido' }),
  name: z.string().min(2, { message: 'Nome deve ter no mínimo 2 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'Senha deve ter no mínimo 6 caracteres' }),
});

const VerifyRegisterSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  code: z.string().length(6, { message: 'Código deve ter 6 dígitos' }),
});

const ResendCodeSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
});

export default async function authRoutes(app: FastifyInstance) {
  app.post('/login', { 
    config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
    schema: {
      tags: ['Auth'],
      description: 'Autentica o usuário',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          remember: { type: 'boolean' }
        }
      }
    }
  }, async (req, reply) => {
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

  app.post('/forgot-password', { config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    const res = await forgotPassword(parsed.data.email);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ ok: true, message: res.message, token: res.token });
  });

  app.post('/reset-password', async (req, reply) => {
    const parsed = ResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    const res = await resetPassword(parsed.data.token, parsed.data.password);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ ok: true, message: res.message });
  });

  app.post('/register', { config: { rateLimit: { max: 3, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    const { cnpj, name, email, password } = parsed.data;
    const res = await registerUser(cnpj, name, email, password);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ ok: true, message: res.message, code: res.code });
  });

  app.post('/verify-register', { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = VerifyRegisterSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    const res = await completeRegistration(parsed.data.email, parsed.data.code);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ ok: true, message: res.message });
  });

  app.post('/resend-code', { config: { rateLimit: { max: 2, timeWindow: '1 minute' } } }, async (req, reply) => {
    const parsed = ResendCodeSchema.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ message: parsed.error.issues[0]?.message ?? 'Dados inválidos' });
    const res = await resendRegistrationCode(parsed.data.email);
    if (!res.ok) return reply.code(res.status).send({ message: res.message });
    return reply.send({ ok: true, message: res.message, code: res.code });
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