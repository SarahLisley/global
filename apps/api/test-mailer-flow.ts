import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '.env') });

import { sendPasswordResetEmail } from './src/utils/mailer';

async function runTest() {
  console.log('⏳ Testando o envio de e-mail integrado da API...');
  
  // Enviando para a própria conta que configuramos para termos certeza que a caixa de entrada vai receber
  const emailDestino = 'gestaodedados@globalhospitalar.com.br';
  const tokenTeste = 'token-fake-para-teste-123';
  const nomeTeste = 'Usuário de Teste';

  const sucesso = await sendPasswordResetEmail(emailDestino, tokenTeste, nomeTeste);

  if (sucesso) {
    console.log('✅ Tudo certo! O e-mail foi disparado com sucesso via Locaweb usando a função real da API.');
    console.log(`Por favor, verifique a caixa de entrada de ${emailDestino}.`);
  } else {
    console.log('❌ Ocorreu uma falha no disparo. Verifique os logs acima.');
  }

  process.exit(0);
}

runTest();
