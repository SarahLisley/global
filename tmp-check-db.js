require('dotenv').config({ path: 'apps/api/.env' });
const oracledb = require('oracledb');

async function test() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.ORACLE_USER,
      password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONN_STRING,
    });

    const result = await connection.execute(`
      SELECT EMAIL, CGC, NOME FROM PCADMIN.BRLOGINWEB WHERE UPPER(TRIM(EMAIL)) = 'CLI6875@TESTE.COM'
    `);
    console.log("BRLOGINWEB:", result.rows);

    if (result.rows.length > 0) {
      const cgc = result.rows[0][1];
      if (cgc) {
        const clients = await connection.execute(`
          SELECT CODCLI, CLIENTE, CGCENT FROM PCADMIN.PCCLIENT 
          WHERE REPLACE(REPLACE(REPLACE(CGCENT, '/',''), '.',''), '-','') = '${cgc.replace(/[.\-\/]/g, '')}'
        `);
        console.log("PCCLIENT:", clients.rows);
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

test();
