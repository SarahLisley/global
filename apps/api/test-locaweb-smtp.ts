import * as nodemailer from 'nodemailer';

async function testLocawebSmtp() {
  console.log('--- TESTANDO CONEXÃO SMTP LOCAWEB ---');

  const transporter = nodemailer.createTransport({
    host: 'email-ssl.com.br',
    port: 465,
    secure: true,
    auth: {
      user: 'gestaodedados@globalhospitalar.com.br',
      pass: 'Global@m1e2',
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('⏳ Verificando conexão e credenciais com Locaweb...');
    await transporter.verify();
    console.log('✅ Conexão com Locaweb bem-sucedida!');

    console.log('\n⏳ Tentando enviar um e-mail de teste...');
    const info = await transporter.sendMail({
      from: 'gestaodedados@globalhospitalar.com.br',
      to: 'gestaodedados@globalhospitalar.com.br',
      subject: 'Teste de E-mail - Locaweb SMTP',
      text: 'Se você recebeu este e-mail, o SMTP da Locaweb está funcionando perfeitamente!',
    });

    console.log(`✅ E-mail enviado com sucesso! Message ID: ${info.messageId}`);
    process.exit(0);
  } catch (err: any) {
    console.error('\n❌ ERRO NO SMTP:', err.message);
    if (err.response) console.error('Resposta do Servidor:', err.response);
    process.exit(1);
  }
}

testLocawebSmtp();
