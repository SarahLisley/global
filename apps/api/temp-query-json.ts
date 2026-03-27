import * as dotenv from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';

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
    
    fs.writeFileSync('clientes_encontrados.json', JSON.stringify(clients, null, 2), 'utf-8');
    process.exit(0);
  } catch (err: any) {
    fs.writeFileSync('clientes_encontrados.json', JSON.stringify({ error: err.message }), 'utf-8');
    process.exit(1);
  }
}

main();
