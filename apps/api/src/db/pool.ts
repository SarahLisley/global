import oracledb from 'oracledb';
import { connectString, env } from '../utils/env';

// Configure oracledb to return CLOBs as strings
(oracledb as any).fetchAsString = [(oracledb as any).CLOB];

const cfg = {
  user: env.ORACLE_USER,
  password: env.ORACLE_PASSWORD,
  connectString,
  poolMin: env.DB_POOL_MIN,
  poolMax: env.DB_POOL_MAX,
  poolIncrement: env.DB_POOL_INCREMENT,
  poolTimeout: env.DB_POOL_TIMEOUT_SEC,
  queueTimeout: env.DB_POOL_QUEUE_TIMEOUT_MS,
  stmtCacheSize: env.DB_STMT_CACHE_SIZE,
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
    poolIncrement: cfg.poolIncrement,
    poolTimeout: cfg.poolTimeout,
    queueTimeout: cfg.queueTimeout,
    stmtCacheSize: cfg.stmtCacheSize,
    // thin mode por padrao em v6+
  } as any);

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

async function gracefulShutdown() {
  try {
    await closePool();
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
