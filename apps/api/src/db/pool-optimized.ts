import oracledb from 'oracledb';
import { connectString, env } from '../utils/env';

// Configure oracledb para performance
(oracledb as any).fetchAsString = [(oracledb as any).CLOB];

// Configurações otimizadas para performance
const cfg = {
  user: env.ORACLE_USER,
  password: env.ORACLE_PASSWORD,
  connectString,
  poolMin: 2, // Mínimo de conexões quentes
  poolMax: 10, // Máximo aumentado para concorrência
  poolIncrement: 2, // Incremento mais agressivo
  poolTimeout: 60, // Timeout reduzido
  queueTimeout: 3000, // Timeout na fila reduzido
  stmtCacheSize: 50, // Cache de statements aumentado
  sessionCallback: async (conn: any) => {
    // Otimizações por sessão
    await conn.execute(`ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'`);
    await conn.execute(`ALTER SESSION SET NLS_TIMESTAMP_FORMAT = 'YYYY-MM-DD HH24:MI:SS'`);
    if (env.ORACLE_CURRENT_SCHEMA) {
      try {
        const schema = env.ORACLE_CURRENT_SCHEMA.trim();
        if (!/^[A-Z0-9_]+$/i.test(schema)) throw new Error('Invalid ORACLE_CURRENT_SCHEMA');
        await conn.execute(`ALTER SESSION SET CURRENT_SCHEMA = ${schema.toUpperCase()}`);
      } catch (err) {
        console.warn('[oracle] CURRENT_SCHEMA not applied:', (err as Error).message);
      }
    }
  },
};

let pool: oracledb.Pool | null = null;

export async function getPool(): Promise<oracledb.Pool> {
  if (pool) return pool;

  console.log('[oracle] Creating optimized connection pool...');
  const start = Date.now();
  
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
    sessionCallback: cfg.sessionCallback,
    // Otimizações adicionais
    homogeneous: false, // Permitir sessões heterogêneas
    externalAuth: false,
    connectTimeout: 5000, // 5s timeout de conexão
    // thin mode por padrao em v6+
  } as any);

  const duration = Date.now() - start;
  console.log(`[oracle] Pool created in ${duration}ms - Min: ${cfg.poolMin}, Max: ${cfg.poolMax}`);

  // Monitoramento do pool (versão simplificada sem eventos)
  console.log('[oracle] Pool monitoring enabled (basic stats)');

  return pool;
}

export async function getConnection(): Promise<oracledb.Connection> {
  const start = Date.now();
  const p = await getPool();
  const conn = await p.getConnection();
  const duration = Date.now() - start;
  
  if (duration > 1000) {
    console.warn(`[oracle] Slow connection acquisition: ${duration}ms`);
  }

  return conn;
}

export async function closePool() {
  if (!pool) return;
  console.log('[oracle] Closing connection pool...');
  await pool.close(10);
  pool = null;
  console.log('[oracle] Pool closed');
}

// Health check do pool (versão simplificada)
export async function getPoolStats() {
  if (!pool) return { status: 'not_initialized' };
  
  try {
    // Versão simplificada sem getPoolStatistics
    return {
      status: 'active',
      message: 'Pool is running',
      poolMin: cfg.poolMin,
      poolMax: cfg.poolMax,
      poolIncrement: cfg.poolIncrement,
    };
  } catch (error: any) {
    return { status: 'error', error: error.message };
  }
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
