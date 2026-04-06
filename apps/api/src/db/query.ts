import oracledb from 'oracledb';
import { getConnection } from './pool';
import { env } from '../utils/env';

type QueryBinds = Record<string, unknown> | unknown[];

function getQuerySnippet(sql: string) {
  return sql.trim().replace(/\s+/g, ' ').slice(0, 160);
}

function logSlowQuery(kind: string, sql: string, startedAt: number) {
  const thresholdMs = env.DB_SLOW_QUERY_MS || 500; // Reduzido para 500ms
  const elapsedMs = Date.now() - startedAt;
  if (elapsedMs > thresholdMs) {
    console.warn(`[db] Slow ${kind} query (${elapsedMs}ms): ${getQuerySnippet(sql)}`);
  }
}

export async function select<T = any>(sql: string, binds?: QueryBinds) {
  const withoutComments = sql
    .replace(/--.*?$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//gm, '');
  const normalized = withoutComments.trim();

  if (!/^(SELECT|WITH)\b/i.test(normalized)) {
    const snippet = normalized.slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(`Only SELECT/CTE statements are allowed in production API (got: "${snippet}...")`);
  }

  const forbidden = /\b(INSERT|UPDATE|DELETE|MERGE|ALTER|CREATE|DROP|TRUNCATE|GRANT|REVOKE)\b/i;
  if (forbidden.test(normalized)) {
    const snippet = normalized.slice(0, 80).replace(/\s+/g, ' ');
    throw new Error(`DML/DDL detected in query (blocked): "${snippet}..."`);
  }

  const conn = await getConnection();
  const startedAt = Date.now();

  try {
    const res = await conn.execute(sql, binds ?? {}, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      fetchArraySize: env.DB_FETCH_ARRAY_SIZE || 200, // Aumentado
      prefetchRows: env.DB_PREFETCH_ROWS || 200, // Aumentado
    } as any);
    return (res.rows ?? []) as T[];
  } finally {
    logSlowQuery('SELECT', normalized, startedAt);
    await conn.close();
  }
}

/**
 * Execute DML statements (INSERT, UPDATE, DELETE) with auto-commit.
 * Returns the number of rows affected.
 */
export async function execute(sql: string, binds?: QueryBinds): Promise<number> {
  const conn = await getConnection();
  const startedAt = Date.now();

  try {
    const res: any = await conn.execute(sql, binds ?? {}, {
      autoCommit: true,
    } as any);
    return res.rowsAffected ?? 0;
  } finally {
    logSlowQuery('DML', sql, startedAt);
    await conn.close();
  }
}

export async function executeMany(sql: string, binds: Record<string, unknown>[]): Promise<number> {
  if (binds.length === 0) {
    return 0;
  }

  const conn = await getConnection();
  const startedAt = Date.now();

  try {
    const executeManyFn = (conn as any).executeMany;
    if (typeof executeManyFn === 'function') {
      const res: any = await executeManyFn.call(conn, sql, binds as any[], {
        autoCommit: true,
      } as any);
      return res.rowsAffected ?? 0;
    }

    let rowsAffected = 0;
    for (const bind of binds) {
      const res: any = await conn.execute(sql, bind, {
        autoCommit: false,
      } as any);
      rowsAffected += res.rowsAffected ?? 0;
    }

    await (conn as any).commit();
    return rowsAffected;
  } finally {
    logSlowQuery('DML batch', sql, startedAt);
    await conn.close();
  }
}

/**
 * Execute an INSERT and return the generated ID (for IDENTITY columns).
 */
export async function insertReturning<T = any>(
  sql: string,
  binds: Record<string, unknown>,
  returningColumn: string
): Promise<T | null> {
  const conn = await getConnection();
  const startedAt = Date.now();

  try {
    const result: any = await conn.execute(
      `${sql} RETURNING ${returningColumn} INTO :out_id`,
      { ...binds, out_id: { dir: (oracledb as any).BIND_OUT, type: (oracledb as any).NUMBER } } as any,
      { autoCommit: true } as any
    );
    const outValues = result.outBinds?.out_id;
    return outValues?.[0] ?? null;
  } finally {
    logSlowQuery('INSERT RETURNING', sql, startedAt);
    await conn.close();
  }
}
