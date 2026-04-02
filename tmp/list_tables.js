const oracledb = require('oracledb');
async function run() {
  let conn;
  try {
    conn = await oracledb.getConnection({
      user: 'GLOBALHTESTE',
      password: 'GL0B4T3ST2H',
      connectString: '144.22.193.233:1521/MDAPVMQTESTE'
    });
    const r = await conn.execute(`SELECT table_name FROM all_tables WHERE owner = 'GLOBALHTESTE' AND table_name LIKE 'BR%'`);
    console.log(JSON.stringify(r.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (conn) await conn.close();
  }
}
run();
