import { execute } from '../src/db/query';
import { OWNER } from '../src/utils/env';
import bcrypt from 'bcrypt';

async function run() {
  try {
    const hash = await bcrypt.hash('BravoAdmin2024', 12);
    const res = await execute(
      `UPDATE ${OWNER}.BRLOGINWEB SET SENHA = :senha WHERE UPPER(TRIM(EMAIL)) = :email`,
      { senha: hash, email: 'ADMIN@GLOBAL.COM' }
    );
    console.log('Rows updated:', res);
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    process.exit(0);
  }
}

run();
