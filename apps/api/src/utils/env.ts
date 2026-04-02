import 'dotenv/config';
import { z } from 'zod';

// Regex para validar nomes de schema/user Oracle — previne SQL injection
const oracleIdentifier = z.string().regex(/^[A-Z0-9_]+$/i, {
  message: 'Deve conter apenas letras, números e underscore (A-Z, 0-9, _)',
});

const envSchema = z.object({
  PORT: z.string().default('4001'),
  ORACLE_HOST: z.string(),
  ORACLE_PORT: z.string().default('1521'),
  ORACLE_SERVICE: z.string(),
  ORACLE_USER: oracleIdentifier,
  ORACLE_PASSWORD: z.string(),
  ORACLE_OWNER: oracleIdentifier.optional(),
  ORACLE_CURRENT_SCHEMA: oracleIdentifier.optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  JWT_SECRET: z.string(),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(0),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(4),
  DB_POOL_INCREMENT: z.coerce.number().int().min(1).default(1),
  DB_POOL_TIMEOUT_SEC: z.coerce.number().int().min(10).default(60),
  DB_POOL_QUEUE_TIMEOUT_MS: z.coerce.number().int().min(0).default(5000),
  DB_STMT_CACHE_SIZE: z.coerce.number().int().min(0).default(40),
  DB_FETCH_ARRAY_SIZE: z.coerce.number().int().min(1).default(100),
  DB_PREFETCH_ROWS: z.coerce.number().int().min(1).default(100),
  DB_SLOW_QUERY_MS: z.coerce.number().int().min(0).optional(),
  DASHBOARD_SOURCE: z.enum(['official','pgb']).default('pgb'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  FRONTEND_URL: z.string().default('http://localhost:3200'),
});

const _env = envSchema.safeParse(process.env);
if (!_env.success) {
  console.error('Invalid environment variables:', _env.error.flatten().fieldErrors);
  process.exit(1);
}
export const env = _env.data;

export const connectString = `${env.ORACLE_HOST}:${env.ORACLE_PORT}/${env.ORACLE_SERVICE}`;

export const OWNER = (env.ORACLE_OWNER ?? env.ORACLE_USER).toUpperCase();

