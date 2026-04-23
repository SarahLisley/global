import { select } from './src/db/query';
import { OWNER } from './src/utils/env';
import bcrypt from 'bcrypt';

async function checkUser() {
  const email = 'gestaodedados@globalhospitalar.com.br';
  const passwordToTest = 'Global@m1e2';

  try {
    const rows = await select<any>(
      `SELECT EMAIL, SENHA, CGC, NOME, TIPO FROM ${OWNER}.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = UPPER(TRIM(:email))`,
      { email }
    );

    if (rows.length === 0) {
      console.log('NOT_FOUND');
      return;
    }

    const user = rows[0];
    const storedPassword = (user.SENHA ?? '').trim();
    const len = storedPassword.length;
    const isHashed = storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2a$');

    let match = false;
    let error = null;
    try {
      if (isHashed) {
        match = await bcrypt.compare(passwordToTest, storedPassword);
      } else {
        match = passwordToTest === storedPassword;
      }
    } catch (e: any) {
      error = e.message;
    }

    console.log(JSON.stringify({
      email: user.EMAIL,
      senha: storedPassword,
      length: len,
      isHashed,
      match,
      error
    }, null, 2));

  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

checkUser().then(() => process.exit(0));
