import 'dotenv/config';
import { buildApp } from './app';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('[server] Starting with performance optimizations...');
  
  let httpsOptions;
  const shouldUseHttps =
    process.env.ENABLE_HTTPS === '1' || process.env.NODE_ENV === 'production';
  
  const certPath = 'C:\\Certs\\cert.pem';
  const keyPath  = 'C:\\Certs\\key.pem';
  const pfxPath  = 'C:\\Certs\\cert.pfx';

  if (shouldUseHttps && fs.existsSync(pfxPath)) {
    httpsOptions = {
      pfx: fs.readFileSync(pfxPath),
      passphrase: 'temp-export-pass'
    };
    console.log('SSL PFX Certificate found. Starting in HTTPS mode.');
  } else if (shouldUseHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    console.log('SSL PEM Certificates found. Starting in HTTPS mode.');
  } else if (!shouldUseHttps) {
    console.log('Starting API in HTTP mode for local development.');
  }

  const app = buildApp({ https: httpsOptions });
  const port = Number(process.env.PORT || 4001);
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`[server] Configuration:`);
  console.log(`- Pool Min: ${process.env.DB_POOL_MIN || 2}`);
  console.log(`- Pool Max: ${process.env.DB_POOL_MAX || 4}`);
  console.log(`- Slow Query Threshold: ${process.env.DB_SLOW_QUERY_MS || 500}ms`);
  console.log(`- Memory Limit: ${process.env.NODE_OPTIONS || 'default'}`);
  
  await app.listen({ port, host });
  
  const protocol = httpsOptions ? 'https' : 'http';
  app.log.info(`API running on ${protocol}://${host}:${port}`);
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
