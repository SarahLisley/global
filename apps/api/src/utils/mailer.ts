/**
 * Utilitário de envio de e-mail via SMTP (Nodemailer).
 */
import nodemailer from 'nodemailer';
import { env } from './env';

const SMTP_HOST = env.SMTP_HOST || '';
const SMTP_PORT = Number(env.SMTP_PORT || 587);
const SMTP_SECURE = env.SMTP_SECURE === 'true';
const SMTP_USER = env.SMTP_USER || '';
const SMTP_PASS = env.SMTP_PASS || '';
const SMTP_FROM = env.SMTP_FROM || `Bravo Portal <${SMTP_USER || 'noreply@bravotecnologia.com.br'}>`;

let transporter: nodemailer.Transporter | null = null;
let etherealReady: Promise<nodemailer.Transporter> | null = null;
let fromAddress = SMTP_FROM;

/**
 * Cria uma conta Ethereal (fake SMTP gratuito) automaticamente.
 */
async function createEtherealTransporter(): Promise<nodemailer.Transporter> {
  const testAccount = await nodemailer.createTestAccount();
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  📧 SMTP automático (Ethereal) criado com sucesso!           ║');
  console.log(`║  👤 Usuário: ${testAccount.user}`);
  console.log(`║  🔑 Senha:   ${testAccount.pass}`);
  console.log('║  🌐 Veja os e-mails em: https://ethereal.email/login         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  fromAddress = `Bravo Portal <${testAccount.user}>`;

  return nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
}

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    console.log(`📧 SMTP configurado: ${SMTP_HOST}:${SMTP_PORT} (user: ${SMTP_USER})`);
    return transporter;
  }

  if (!etherealReady) {
    etherealReady = createEtherealTransporter();
  }
  transporter = await etherealReady;
  return transporter;
}

export function isSmtpConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

function buildEmailHtml(code: string, name?: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: #2563eb; font-weight: 800;">Bravo</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Portal do Cliente</p>
      </div>

      <p style="font-size: 15px; color: #374151; margin-bottom: 8px;">
        Olá${name ? ` <strong>${name}</strong>` : ''},
      </p>
      <p style="font-size: 15px; color: #374151; margin-bottom: 24px;">
        Use o código abaixo para verificar seu e-mail e completar seu cadastro:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 2px solid #2563eb; border-radius: 12px; padding: 16px 32px;">
          <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e40af;">
            ${code}
          </span>
        </div>
      </div>

      <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 24px;">
        Este código expira em <strong>10 minutos</strong>.<br>
        Se você não solicitou este código, ignore este e-mail.
      </p>

      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;">
      <p style="font-size: 11px; color: #d1d5db; text-align: center;">
        Bravo — Portal do Cliente &copy; ${new Date().getFullYear()}
      </p>
    </div>`;
}

export async function sendVerificationEmail(to: string, code: string, name?: string): Promise<boolean> {
  console.log(`[EMAIL] Enviando código ${code} para ${to}`);
  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: fromAddress,
      to,
      subject: `${code} — Código de verificação Bravo`,
      html: buildEmailHtml(code, name),
    });
    return true;
  } catch (err: any) {
    console.error(`❌ Falha ao enviar e-mail para ${to}:`, err.message);
    return false;
  }
}

function buildPasswordResetEmailHtml(resetUrl: string, name?: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="margin: 0; font-size: 24px; color: #2563eb; font-weight: 800;">Bravo</h1>
        <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Portal do Cliente</p>
      </div>

      <p style="font-size: 15px; color: #374151; margin-bottom: 8px;">
        Olá${name ? ` <strong>${name}</strong>` : ''},
      </p>
      <p style="font-size: 15px; color: #374151; margin-bottom: 24px;">
        Você solicitou a recuperação da sua senha. Clique no botão abaixo para definir uma nova senha:
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          Redefinir Senha
        </a>
      </div>

      <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 24px;">
        Ou copie e cole o link no seu navegador:<br>
        <span style="display: inline-block; margin-top: 8px; color: #2563eb; word-break: break-all;">${resetUrl}</span>
      </p>
      <p style="font-size: 13px; color: #9ca3af; text-align: center; margin-top: 24px;">
        Este link expira em <strong>30 minutos</strong>.<br>
        Se você não solicitou a troca de senha, ignore este e-mail.
      </p>

      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;">
      <p style="font-size: 11px; color: #d1d5db; text-align: center;">
        Bravo — Portal do Cliente &copy; ${new Date().getFullYear()}
      </p>
    </div>`;
}

export async function sendPasswordResetEmail(to: string, token: string, name?: string): Promise<boolean> {
  const frontUrl = env.FRONTEND_URL || 'http://localhost:3200';
  const resetUrl = `${frontUrl}/reset-password?token=${token}`;

  console.log(`[EMAIL] Enviando reset de senha para ${to}: ${resetUrl}`);

  try {
    const transport = await getTransporter();
    await transport.sendMail({
      from: fromAddress,
      to,
      subject: 'Recuperação de Senha Bravo',
      html: buildPasswordResetEmailHtml(resetUrl, name),
    });
    return true;
  } catch (err: any) {
    console.error(`❌ Falha ao enviar e-mail para ${to}:`, err.message);
    return false;
  }
}
