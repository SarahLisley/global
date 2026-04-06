import { select } from '../apps/api/src/db/query';
import { OWNER } from '../apps/api/src/utils/env';

async function run() {
  try {
    const users = await select(`SELECT EMAIL, TIPO FROM ${OWNER}.BRLOGINWEB`);
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('--- END ---');
  } catch (e) {
    console.error('Error fetching users:', e);
  } finally {
    process.exit(0);
  }
}

run();
