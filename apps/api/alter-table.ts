import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { execute } from './src/db/query';

dotenv.config({ path: resolve(__dirname, '.env') });
const OWNER = process.env.ORACLE_USER || 'GLOBALHTESTE';

async function alterTable() {
  try {
    console.log(`Alterando tamanho da coluna SENHA na tabela ${OWNER}.BRLOGINWEB...`);
    await execute(`ALTER TABLE ${OWNER}.BRLOGINWEB MODIFY SENHA VARCHAR2(100)`);
    console.log('✅ Tabela alterada com sucesso! A coluna SENHA agora suporta até 100 caracteres.');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ Erro ao alterar tabela:', err.message);
    process.exit(1);
  }
}

alterTable();
