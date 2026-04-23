import { select } from './src/db/query';
import { OWNER } from './src/utils/env';

async function getUsers() {
  try {
    const rows = await select<any>(
      `SELECT EMAIL, TIPO FROM ${OWNER}.BRLOGINWEB WHERE UPPER(EMAIL) LIKE '%GESTAODEDADOS%' OR UPPER(EMAIL) LIKE '%GLOBALHOSPITALAR%'`
    );
    console.log('Resultados da busca:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

getUsers().then(() => process.exit(0));
