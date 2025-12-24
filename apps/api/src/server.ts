import { buildApp } from './app';

async function main() {
  const app = buildApp();
  const port = Number(process.env.PORT || 4001);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  app.log.info(`API running on http://${host}:${port}`);
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
}); 