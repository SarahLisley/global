import crypto from 'crypto';
const b64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');

export function signToken(payload: Record<string, unknown>, secret: string, expiresInSec?: number) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, ...(expiresInSec ? { exp: now + expiresInSec } : {}) };
  const data = `${b64(header)}.${b64(body)}`;
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function verifyToken(token: string, secret: string): { ok: true; payload: any } | { ok: false; error: string } {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { ok: false, error: 'Formato inválido' };
    const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) {
      return { ok: false, error: 'Assinatura inválida' };
    }
    const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) return { ok: false, error: 'Token expirado' };
    if (payload.iat && payload.iat > now + 60) return { ok: false, error: 'IAT inválido' };
    return { ok: true, payload };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Falha ao validar token' };
  }
}