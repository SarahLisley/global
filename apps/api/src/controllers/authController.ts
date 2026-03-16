import { select, execute } from '../db/query';
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

  try {
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

    const token = signToken({ sub: user.EMAIL, codcli, cgc: unmaskCNPJ(cgc), name: user.NOME }, env.JWT_SECRET, 8 * 60 * 60);

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
  } catch (err: any) {
    console.error('Login Error:', err);
    return { ok: false, status: 500, message: `DB Error: ${err.message}` as const };
  }
}

export async function getUserProfile(email: string) {
  try {
    const rows = await select<DbUser>(
      `
      SELECT 
        l.EMAIL, l.NOME, l.CGC, l.TIPO,
        c.CODCLI, c.CLIENTE,
        c.ENDE, c.BAIRRO, c.CIDADE, c.UF, c.CEP, c.TEL
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
    if (!user) return { ok: false, status: 404, message: 'Usuário não encontrado' as const };

    return {
      ok: true,
      status: 200,
      profile: {
        email: user.EMAIL,
        name: user.NOME ?? '',
        type: user.TIPO ?? '',
        client: {
          code: user.CODCLI ?? null,
          name: user.CLIENTE ?? '',
          document: user.CGC ?? '',
          phone: (user as any).TEL ?? '',
          address: {
            street: (user as any).ENDE,
            neighborhood: (user as any).BAIRRO,
            city: (user as any).CIDADE,
            state: (user as any).UF,
            zip: (user as any).CEP,
          }
        }
      }
    };
  } catch (err: any) {
    return { ok: false, status: 500, message: `DB Error: ${err.message}` as const };
  }
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

export async function forgotPassword(email: string) {
  try {
    const emailClean = email.trim();
    console.log(`[FORGOT_PASSWORD] Iniciando recuperação para: ${emailClean}`);

    console.log(`[FORGOT_PASSWORD] Buscando no banco BRLOGINWEB...`);
    const rows = await select<{ EMAIL: string; NOME: string }>(
      `SELECT EMAIL, NOME FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email: emailClean }
    );

    if (rows.length === 0) {
      console.log(`[FORGOT_PASSWORD] E-mail não encontrado no banco de dados.`);
      return { ok: true, status: 200, message: 'Se o e-mail existir, você receberá um link de recuperação.' };
    }

    const user = rows[0];
    console.log(`[FORGOT_PASSWORD] E-mail encontrado. Gerando token para: ${user.EMAIL}`);

    const { createPasswordResetToken } = await import('../utils/verificationStore');
    const token = await createPasswordResetToken(user.EMAIL, user.NOME);

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      ok: true,
      status: 200,
      message: 'Se o e-mail existir, você receberá um link de recuperação.',
      token: isDev ? token : undefined
    };
  } catch (err: any) {
    console.error('ForgotPassword Error:', err);
    return { ok: false, status: 500, message: `Erro: ${err.message}` };
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    const { verifyPasswordResetToken } = await import('../utils/verificationStore');
    const result = verifyPasswordResetToken(token);

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'Link inválido ou expirado.',
        expired: 'Link expirado. Solicite nova recuperação.',
        too_many_attempts: 'Muitas tentativas inválidas. Solicite nova recuperação.'
      };
      return { ok: false, status: 400, message: messages[result.reason] as string };
    }

    await execute(
      `UPDATE ${OWNER}.BRLOGINWEB SET SENHA = TRIM(:senha) WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { senha: newPassword, email: result.email }
    );

    return { ok: true, status: 200, message: 'Senha atualizada com sucesso. Você já pode fazer login.' };
  } catch (err: any) {
    console.error('ResetPassword Error:', err);
    return { ok: false, status: 500, message: `Erro: ${err.message}` };
  }
}