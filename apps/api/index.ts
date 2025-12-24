import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from './src/app';

const app = buildApp();

// Prepare fastify antes de aceitar requisições
let readyPromise: Promise<void> | null = null;
function ensureReady() {
  if (!readyPromise) readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  return readyPromise;
}

// Handler serverless para Vercel (NÃO usa app.listen aqui)
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureReady();
    // @ts-ignore Fastify expõe .routing(req, res)
    app.routing(req, res);
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'FUNCTION_INVOCATION_FAILED', detail: err?.message }));
  }
}