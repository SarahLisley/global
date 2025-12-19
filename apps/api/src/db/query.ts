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