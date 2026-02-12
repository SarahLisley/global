
import { select } from '../apps/api/src/db/query';
import { OWNER } from '../apps/api/src/utils/env';

async function run() {
  try {
    console.log('Querying PCPREST for boleto data...');
    const rows = await select(
      `SELECT 
        NUMTRANSVENDA, 
        PREST, 
        DUPLIC, 
        LINHADIG, 
        CODBARRA, 
        NOSSONUMBCO, 
        NOMEARQUIVO, 
        PASTAARQUIVOBOLETO,
        DTVENC,
        VALOR
      FROM ${OWNER}.PCPREST 
      WHERE ROWNUM <= 10
      ORDER BY DTVENC DESC`
    );

    console.log('Results:', JSON.stringify(rows, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
