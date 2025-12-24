import type { IncomingMessage, ServerResponse } from 'http';
import { buildApp } from './src/app';

// Cria a instância do Fastify sem chamar listen()
const app = buildApp();

// Prepare fastify antes de aceitar requisições
let readyPromise: Promise<void> | null = null;
function ensureReady() {
  if (!readyPromise) readyPromise = Promise.resolve(app.ready()).then(() => undefined);
  return readyPromise;
}

// Handler serverless para Vercel
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await ensureReady();
    // Encaminha a requisição crua para o roteador do Fastify
    // (sem app.listen em ambiente serverless)
    // @ts-ignore - Fastify expõe .routing(req, res)
    app.routing(req, res);
  } catch (err: any) {
    // Fallback de erro para não estourar 500 sem body
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'FUNCTION_INVOCATION_FAILED', detail: err?.message }));
  }
}