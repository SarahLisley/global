import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env explicitly
dotenv.config({ path: resolve(__dirname, '.env') });

import { select } from './src/db/query';

const OWNER = process.env.ORACLE_USER || 'GLOBALHTESTE';

async function main() {
  try {
    const clients = await select<{ CODCLI: number; CLIENTE: string; CGCENT: string; ESTENT: string; MUNICENT: string }>(
      `SELECT CODCLI, CLIENTE, CGCENT, ESTENT, MUNICENT
       FROM ${OWNER}.PCCLIENT
       WHERE CODCLI IN (1338, 1250, 585)`
    );
    
    console.log('\n--- CLIENTES ENCONTRADOS ---\n');
    clients.forEach(c => {
      console.log(`CODCLI: ${c.CODCLI}`);
      console.log(`NOME: ${c.CLIENTE}`);
      
      let cnpj = c.CGCENT;
      if (cnpj && cnpj.length === 14) {
        cnpj = `${cnpj.substring(0,2)}.${cnpj.substring(2,5)}.${cnpj.substring(5,8)}/${cnpj.substring(8,12)}-${cnpj.substring(12,14)}`;
      }
      console.log(`CNPJ: ${cnpj} (Bruto: ${c.CGCENT})`);
      console.log(`LOCAL: ${c.MUNICENT} - ${c.ESTENT}`);
      console.log('------------------------------');
    });

    process.exit(0);
  } catch (err) {
    console.error('Erro na consulta:', err);
    process.exit(1);
  }
}

main();
