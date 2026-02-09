
import { z } from 'zod';

// Esquema de Login
export const LoginInputSchema = z.object({
  email: z.string().email({ message: "E-mail inválido" }),
  password: z.string().min(1, { message: "Senha é obrigatória" }),
});

export type LoginInput = z.infer<typeof LoginInputSchema>;

// Esquema do Payload do Token JWT
export const TokenPayloadSchema = z.object({
  sub: z.string(),   // ID do usuário ou email
  codcli: z.preprocess((val) => Number(val), z.number()), // Código do cliente
  name: z.string().optional(),
  email: z.string().optional(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

export type TokenPayload = z.infer<typeof TokenPayloadSchema>;
