import oracledb from 'oracledb';
import { getConnection } from './pool';

export async function select<T = any>(sql: string, binds?: Record<string, unknown> | unknown[]) {
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
  try {
    const res = await conn.execute(sql, binds ?? {}, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
    } as any);
    return (res.rows ?? []) as T[];
  } finally {
    await conn.close();
  }
}

/**
 * Execute DML statements (INSERT, UPDATE, DELETE) with auto-commit.
 * Returns the number of rows affected.
 */
export async function execute(sql: string, binds?: Record<string, unknown> | unknown[]): Promise<number> {
  const conn = await getConnection();
  try {
    const res = await conn.execute(sql, binds ?? {}, {
      autoCommit: true,
    } as any);
    return res.rowsAffected ?? 0;
  } finally {
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
  try {
    const result = await conn.execute(
      `${sql} RETURNING ${returningColumn} INTO :out_id`,
      { ...binds, out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } },
      { autoCommit: true } as any
    );
    const outValues = (result.outBinds as any)?.out_id;
    return outValues?.[0] ?? null;
  } finally {
    await conn.close();
  }
}