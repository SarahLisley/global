import { buildAppOptimized } from './app-optimized';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('[server] Starting optimized server...');
  
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
    console.log('[server] SSL PFX Certificate found. Starting in HTTPS mode.');
  } else if (shouldUseHttps && fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    console.log('[server] SSL PEM Certificates found. Starting in HTTPS mode.');
  } else if (!shouldUseHttps) {
    console.log('[server] Starting API in HTTP mode for local development.');
  }

  const app = buildAppOptimized({ https: httpsOptions });
  const port = Number(process.env.PORT || 4001);
  const host = process.env.HOST || '0.0.0.0';
  
  console.log(`[server] Starting on ${host}:${port}...`);
  await app.listen({ port, host });
  
  const protocol = httpsOptions ? 'https' : 'http';
  console.log(`[server] ✅ Optimized API running on ${protocol}://${host}:${port}`);
  console.log(`[server] 🚀 Performance optimizations enabled`);
}

main().catch((err) => {
  console.error('[server] Failed to start optimized server', err);
  process.exit(1);
});
