import oracledb from 'oracledb';
import { connectString, env } from '../utils/env';

let pool: oracledb.Pool | null = null;

export async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;
  pool = await oracledb.createPool({
    user: env.ORACLE_USER,
    password: env.ORACLE_PASSWORD,
    connectString,
    poolMin: env.DB_POOL_MIN,
    poolMax: env.DB_POOL_MAX,
    poolTimeout: env.DB_POOL_TIMEOUT_SEC,
    homogeneous: true,
  });
  return pool;
}

export async function getConnection(): Promise<oracledb.Connection> {
  const p = await getPool();
  const conn = await p.getConnection();

  if (env.ORACLE_CURRENT_SCHEMA) {
    try {
      const schema = env.ORACLE_CURRENT_SCHEMA.trim();
      if (!/^[A-Z0-9_]+$/i.test(schema)) throw new Error('Invalid ORACLE_CURRENT_SCHEMA');
      await conn.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${schema.toUpperCase()}`);
    } catch (err) {
      console.warn('[oracle] CURRENT_SCHEMA not applied:', (err as Error).message);
    }
  }
  return conn;
}

export async function closePool() {
  if (!pool) return;
  await pool.close(10);
  pool = null;
}

process.on('SIGINT', async () => {
  try {
    await closePool();
  } finally {
    process.exit(0);
  }
});