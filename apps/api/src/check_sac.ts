
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis de ambiente do arquivo .env na raiz do apps/api
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { getConnection } from './db/pool';
import { OWNER } from './utils/env';

async function check() {
  let conn;
  try {
    console.log('Conectando ao banco...');
    conn = await getConnection();
    console.log('Conectado!');

    // Check count total
    console.log(`Verificando total de registros em ${OWNER}.BRSACC...`);
    const resultTotal = await conn.execute(`SELECT COUNT(*) as TOTAL FROM ${OWNER}.BRSACC`);
    const total = (resultTotal.rows?.[0] as any)?.[0] ?? 0;
    console.log(`Total de tickets encontrados: ${total}`);

    if (total > 0) {
      // Check count por dia (top 10 dias com mais tickets)
      console.log(`\nTop 10 dias com mais tickets:`);
      const resultDays = await conn.execute(`
        SELECT TRUNC(DTABERTURA) as DIA, COUNT(*) as QTD
        FROM ${OWNER}.BRSACC
        GROUP BY TRUNC(DTABERTURA)
        ORDER BY TRUNC(DTABERTURA) DESC
        FETCH FIRST 10 ROWS ONLY
      `);

      resultDays.rows?.forEach((row: any) => {
        console.log(`Dia: ${row[0]} - Qtd: ${row[1]}`);
      });
    }

  } catch (err) {
    console.error('Erro ao verificar banco:', err);
  } finally {
    if (conn) {
      try {
        await conn.close();
        console.log('\nConexão fechada.');
      } catch (err) {
        console.error('Erro ao fechar conexão:', err);
      }
    }
    process.exit(0);
  }
}

check();
