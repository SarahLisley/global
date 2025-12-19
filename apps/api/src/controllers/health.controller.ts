import { select } from '../db/query';

export async function pingDb() {
  const rows = await select<{ OK: number }>('SELECT 1 AS OK FROM DUAL');
  return rows[0] ?? { OK: 0 };
}

export async function serverTime() {
  const rows = await select<{ NOW: string }>("SELECT TO_CHAR(SYSDATE, 'YYYY-MM-DD\"T\"HH24:MI:SS') AS NOW FROM DUAL");
  return rows[0];
}