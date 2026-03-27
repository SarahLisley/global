import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as nodemailer from 'nodemailer';

dotenv.config({ path: resolve(__dirname, '.env') });

async function testConnection(host: string, port: number, secure: boolean) {
  console.log(`\n\n--- TESTANDO ${host}:${port} ---`);
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { ciphers: 'SSLv3' }
  });

  try {
    await transporter.verify();
    console.log(`✅ SUCESSO na conexão! Autenticação aceita via ${host}`);
    return true;
  } catch (err: any) {
    console.log(`❌ FALHA na autenticação via ${host}`);
    console.log('Mensagem:', err.message);
    if (err.response) console.log('Resposta SMTP:', err.response);
    return false;
  }
}

async function main() {
  const success1 = await testConnection('smtp-mail.outlook.com', 587, false);
  const success2 = await testConnection('smtp.office365.com', 587, false);
  process.exit((success1 || success2) ? 0 : 1);
}

main();
