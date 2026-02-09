import oracledb from 'oracledb';
import { connectString, env } from '../utils/env';

// Configure oracledb to return CLOBs as strings
(oracledb as any).fetchAsString = [(oracledb as any).CLOB];

const cfg = {
  user: process.env.ORACLE_USER!,
  password: process.env.ORACLE_PASSWORD!,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
  poolMin: Number(process.env.DB_POOL_MIN ?? 0),
  poolMax: Number(process.env.DB_POOL_MAX ?? 4),
  poolTimeout: Number(process.env.DB_POOL_TIMEOUT_SEC ?? 60),
};

let pool: oracledb.Pool | null = null;

export async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;
  pool = await oracledb.createPool({
    user: cfg.user,
    password: cfg.password,
    connectString: cfg.connectString,
    poolMin: cfg.poolMin,
    poolMax: cfg.poolMax,
    poolTimeout: cfg.poolTimeout,
    // thin mode por padrão em v6+
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