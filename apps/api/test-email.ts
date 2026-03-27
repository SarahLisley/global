import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as nodemailer from 'nodemailer';

dotenv.config({ path: resolve(__dirname, '.env') });

async function testEmail() {
  console.log('--- TESTANDO CONEXÃO SMTP ---');
  console.log(`HOST: ${process.env.SMTP_HOST}`);
  console.log(`PORT: ${process.env.SMTP_PORT}`);
  console.log(`USER: ${process.env.SMTP_USER}`);
  console.log(`PASS: ${process.env.SMTP_PASS ? '********' : 'NÃO DEFINIDO'}`);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      ciphers: 'SSLv3', // sometimes needed for outlook
      rejectUnauthorized: false
    }
  });

  try {
    console.log('\n⏳ Verificando conexão e credenciais com o Outlook...');
    await transporter.verify();
    console.log('✅ Conexão com o Outlook bem-sucedida!');

    console.log('\n⏳ Tentando enviar um e-mail de teste...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: 'Teste de E-mail - Portal Global',
      text: 'Se você recebeu este e-mail, o SMTP está funcionando perfeitamente!',
    });

    console.log(`✅ E-mail enviado com sucesso! Message ID: ${info.messageId}`);
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ ERRO NO SMTP:');
    console.error(err.message);
    if (err.response) console.error('Resposta do Servidor:', err.response);
    
    console.log('\n💡 DIAGNÓSTICO:');
    if (err.message.includes('Authentication unsuccessful') || err.message.includes('535 5.7.139')) {
      console.log('> O Outlook bloqueou o login. Motivos comuns:');
      console.log('  1. O SMTP pode estar desativado para contas recém-criadas (precisa ativar no painel do Outlook).');
      console.log('  2. Você ativou a Verificação em Duas Etapas e precisa criar uma "Senha de Aplicativo" na Microsoft.');
    }
    process.exit(1);
  }
}

testEmail();
