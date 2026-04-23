/**
 * Script para apagar a conta sarahlisley@alu.ufc.br da tabela BRLOGINWEB
 */
import { execute, select } from './src/db/query';
import { OWNER } from './src/utils/env';

const EMAIL_TO_DELETE = 'sarahlisley@alu.ufc.br';

async function deleteAccount() {
  try {
    // 1. Verificar se a conta existe
    console.log(`Buscando conta: ${EMAIL_TO_DELETE}...`);
    const rows = await select<any>(
      `SELECT EMAIL, NOME, TIPO FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email)) FETCH FIRST 1 ROWS ONLY`,
      { email: EMAIL_TO_DELETE }
    );

    if (rows.length === 0) {
      console.log('❌ Conta não encontrada no banco de dados.');
      return;
    }

    console.log('✅ Conta encontrada:');
    console.log(JSON.stringify(rows[0], null, 2));

    // 2. Deletar a conta
    console.log(`\nDeletando conta ${EMAIL_TO_DELETE}...`);
    const affected = await execute(
      `DELETE FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { email: EMAIL_TO_DELETE }
    );

    console.log(`✅ ${affected} registro(s) removido(s) com sucesso.`);
  } catch (err: any) {
    console.error('❌ Erro:', err.message);
  }
}

deleteAccount().then(() => process.exit(0));
