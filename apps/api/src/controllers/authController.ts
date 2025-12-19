import { select } from '../db/query';
import { signToken, verifyToken } from '../utils/token';
import { env, OWNER } from '../utils/env';

type DbUser = {
  EMAIL: string;
  SENHA: string;
  CGC?: string | null;
  TIPO?: string | null;
  NOME?: string | null;
  CODCLI?: number | null;
  CLIENTE?: string | null;
};

function unmaskCNPJ(v?: string | null) {
  return (v ?? '').replace(/[.\-\/]/g, '');
}

export async function login(email: string, password: string) {
  const rows = await select<DbUser>(
    `
    SELECT 
      l.EMAIL, l.SENHA, l.CGC, l.TIPO, l.NOME,
      c.CODCLI, c.CLIENTE
    FROM ${OWNER}.BRLOGINWEB l
    LEFT JOIN ${OWNER}.PCCLIENT c
      ON REPLACE(REPLACE(REPLACE(l.CGC, '/',''), '.',''), '-','')
       = REPLACE(REPLACE(REPLACE(c.CGCENT, '/',''), '.',''), '-','')
    WHERE UPPER(TRIM(l.EMAIL)) = UPPER(TRIM(:email))
    FETCH FIRST 1 ROWS ONLY
    `,
    { email }
  );

  const user = rows[0];
  if (!user) return { ok: false, status: 401, message: 'Usuário não encontrado' as const };

  const ok = (password ?? '') === (user.SENHA ?? '').trim();
  if (!ok) return { ok: false, status: 401, message: 'Senha inválida' as const };

  const cgc = user.CGC ?? '';
  const codcli = user.CODCLI ?? null;

  const token = signToken({ sub: user.EMAIL, codcli, cgc: unmaskCNPJ(cgc) }, env.JWT_SECRET, 60 * 60);

  return {
    ok: true,
    status: 200,
    session: {
      token,
      user: {
        email: user.EMAIL,
        name: user.NOME ?? '',
        cgc: cgc,
        tipo: user.TIPO ?? '',
        codcli,
        cliente: user.CLIENTE ?? '',
      },
    },
  };
}

export function parseBearer(authHeader?: string | null) {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export function whoamiFromToken(token?: string | null) {
  if (!token) return { ok: false as const, status: 401, message: 'Token ausente' };
  const res = verifyToken(token, env.JWT_SECRET);
  if (!res.ok) return { ok: false as const, status: 401, message: res.error };
  return { ok: true as const, status: 200, payload: res.payload };
}

export async function listDevUsers(limit = 5) {
  if (process.env.EXPOSE_DEV_DEBUG !== '1') {
    return { ok: false as const, status: 404, message: 'Indisponível' };
  }
  const users = await select<{ EMAIL: string; SENHA: string; CGC: string }>(
    `
    SELECT EMAIL, SENHA, CGC
    FROM ${OWNER}.BRLOGINWEB
    FETCH FIRST :limit ROWS ONLY
    `,
    { limit }
  );
  return { ok: true as const, status: 200, users };
}