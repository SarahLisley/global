import { select, execute } from '../db/query';
import { signToken, verifyToken } from '../utils/token';
import { env, OWNER } from '../utils/env';
import { extractCodcli } from '../utils/auth';
import type { FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

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

    const storedPassword = (user.SENHA ?? '').trim();
    const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');

    let passwordMatch = false;
    if (isHashed) {
      // Senha já hasheada — comparação segura
      passwordMatch = await bcrypt.compare(password ?? '', storedPassword);
    } else {
      // Senha legada (texto puro) — comparação direta + lazy migration
      passwordMatch = (password ?? '') === storedPassword;
      if (passwordMatch) {
        // Migração lazy: hashear a senha no banco automaticamente
        try {
          const hashed = await bcrypt.hash(storedPassword, BCRYPT_ROUNDS);
          await execute(
            `UPDATE ${OWNER}.BRLOGINWEB SET SENHA = :senha WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
            { senha: hashed, email }
          );
        } catch (hashErr) {
          // Não bloquear login se falhar o hash
          console.warn('[AUTH] Lazy hash migration failed:', (hashErr as Error).message);
        }
      }
    }
    if (!passwordMatch) return { ok: false, status: 401, message: 'Senha inválida' as const };

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
    return { ok: false, status: 500, message: 'Erro interno ao processar login. Tente novamente.' as const };
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
    console.error('GetUserProfile Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao carregar perfil.' as const };
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
  const users = await select<{ EMAIL: string; CGC: string }>(
    `
    SELECT EMAIL, CGC
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
    const rows = await select<{ EMAIL: string; NOME: string }>(
      `SELECT EMAIL, NOME FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email: emailClean }
    );

    if (rows.length === 0) {
      return { ok: true, status: 200, message: 'Se o e-mail existir, você receberá um link de recuperação.' };
    }

    const user = rows[0];

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
    return { ok: false, status: 500, message: 'Erro interno ao processar recuperação de senha.' };
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

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await execute(
      `UPDATE ${OWNER}.BRLOGINWEB SET SENHA = :senha WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { senha: hashedPassword, email: result.email }
    );

    return { ok: true, status: 200, message: 'Senha atualizada com sucesso. Você já pode fazer login.' };
  } catch (err: any) {
    console.error('ResetPassword Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao redefinir senha.' };
  }
}

export async function registerUser(cnpj: string, name: string, email: string, password: string) {
  try {
    // 1. Validar CNPJ na tabela PCCLIENT
    const cnpjClean = cnpj.replace(/[.\-\/]/g, '');
    const clients = await select<{ CODCLI: number; CLIENTE: string; CGCENT: string }>(
      `SELECT CODCLI, CLIENTE, CGCENT
       FROM ${OWNER}.PCCLIENT
       WHERE REPLACE(REPLACE(REPLACE(CGCENT, '/',''), '.',''), '-','') = :cnpj
       FETCH FIRST 1 ROWS ONLY`,
      { cnpj: cnpjClean }
    );

    if (clients.length === 0) {
      return { ok: false, status: 400, message: 'CNPJ não encontrado na base de clientes. Verifique o número informado.' };
    }

    // 2. Verificar se e-mail já existe
    const existing = await select<{ EMAIL: string }>(
      `SELECT EMAIL FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email: email.trim() }
    );

    if (existing.length > 0) {
      return { ok: false, status: 409, message: 'Este e-mail já está cadastrado. Tente fazer login ou recuperar a senha.' };
    }

    // 3. Criar registro pendente com código de verificação
    const { createPendingRegistration } = await import('../utils/verificationStore');
    const code = await createPendingRegistration({
      cnpj: cnpjClean,
      name: name.trim(),
      email: email.trim(),
      password,
    });

    const isDev = process.env.NODE_ENV !== 'production';

    return {
      ok: true,
      status: 200,
      message: 'Código de verificação enviado para seu e-mail.',
      code: isDev ? code : undefined,
    };
  } catch (err: any) {
    console.error('Register Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao cadastrar. Tente novamente.' };
  }
}

export async function completeRegistration(email: string, code: string) {
  try {
    const { verifyCode } = await import('../utils/verificationStore');
    const result = verifyCode(email, code);

    if (!result.ok) {
      const messages: Record<string, string> = {
        not_found: 'Código não encontrado. Solicite um novo cadastro.',
        expired: 'Código expirado. Solicite um novo cadastro.',
        invalid_code: 'Código inválido. Tente novamente.',
        too_many_attempts: 'Muitas tentativas. Solicite um novo cadastro.',
      };
      return { ok: false, status: 400, message: messages[result.reason] ?? 'Erro na verificação' };
    }

    const { cnpj, name, email: userEmail, password } = result.data;

    // Verificar novamente se o e-mail não foi cadastrado no intervalo
    const existing = await select<{ EMAIL: string }>(
      `SELECT EMAIL FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email: userEmail }
    );

    if (existing.length > 0) {
      return { ok: false, status: 409, message: 'Este e-mail já foi cadastrado.' };
    }

    // Hash da senha e inserir no banco
    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await execute(
      `INSERT INTO ${OWNER}.BRLOGINWEB (EMAIL, SENHA, CGC, NOME, TIPO) VALUES (:email, :senha, :cgc, :nome, 'C')`,
      { email: userEmail, senha: hashedPassword, cgc: cnpj, nome: name }
    );

    return { ok: true, status: 200, message: 'Cadastro realizado com sucesso! Faça login para continuar.' };
  } catch (err: any) {
    console.error('CompleteRegistration Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao completar cadastro.' };
  }
}

export async function resendRegistrationCode(email: string) {
  try {
    const { resendCode } = await import('../utils/verificationStore');
    const newCode = await resendCode(email);

    if (!newCode) {
      return { ok: false, status: 404, message: 'Nenhum cadastro pendente encontrado. Inicie o cadastro novamente.' };
    }

    const isDev = process.env.NODE_ENV !== 'production';
    return {
      ok: true,
      status: 200,
      message: 'Novo código enviado para seu e-mail.',
      code: isDev ? newCode : undefined,
    };
  } catch (err: any) {
    console.error('ResendCode Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao reenviar código.' };
  }
}

export async function updateProfile(email: string, name: string) {
  try {
    await execute(
      `UPDATE ${OWNER}.BRLOGINWEB SET NOME = :nome WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { nome: name, email }
    );
    return { ok: true, status: 200, message: 'Perfil atualizado com sucesso.' };
  } catch (err: any) {
    console.error('UpdateProfile Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao atualizar perfil.' };
  }
}

export async function updatePassword(email: string, currentPass: string, newPass: string) {
  try {
    const rows = await select<{ SENHA: string }>(
      `SELECT SENHA FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email }
    );

    if (rows.length === 0) return { ok: false, status: 404, message: 'Usuário não encontrado.' };
    const user = rows[0];

    const storedPassword = (user.SENHA ?? '').trim();
    const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');

    let passwordMatch = false;
    if (isHashed) {
      passwordMatch = await bcrypt.compare(currentPass, storedPassword);
    } else {
      passwordMatch = currentPass === storedPassword;
    }

    if (!passwordMatch) return { ok: false, status: 401, message: 'Senha atual incorreta.' };

    const hashedPassword = await bcrypt.hash(newPass, BCRYPT_ROUNDS);
    await execute(
      `UPDATE ${OWNER}.BRLOGINWEB SET SENHA = :senha WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { senha: hashedPassword, email }
    );

    return { ok: true, status: 200, message: 'Senha alterada com sucesso.' };
  } catch (err: any) {
    console.error('UpdatePassword Error:', err);
    return { ok: false, status: 500, message: 'Erro interno ao alterar senha.' };
  }
}