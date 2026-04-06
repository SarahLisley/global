import type { FastifyRequest } from 'fastify';
import { verifyToken } from './token';
import { env } from './env';

/**
 * Extracts and validates the codcli (client code) from the request's Authorization header.
 * Throws an object with { status, error } if validation fails.
 */
export function extractCodcli(req: FastifyRequest): { codcli: number | null; tipo: string | null; payload: any } {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    throw { status: 401, error: 'Token ausente' };
  }
  const t = auth.slice(7);
  const v = verifyToken(t, env.JWT_SECRET);
  if (!v.ok) {
    throw { status: 401, error: v.error };
  }
  const codcli = v.payload?.codcli != null ? Number(v.payload.codcli) : null;
  const tipo = v.payload?.tipo != null ? String(v.payload.tipo).toUpperCase() : null;
  return { codcli, tipo, payload: v.payload };
}

/**
 * Helper to handle auth errors thrown by extractCodcli.
 */
export function handleAuthError(err: any, reply: any) {
  if (err && typeof err === 'object' && 'status' in err && 'error' in err) {
    return reply.status(err.status).send({ error: err.error });
  }
  return reply.status(500).send({ error: (err as Error).message });
}
