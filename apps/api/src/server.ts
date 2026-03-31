import { buildApp } from './app';
import fs from 'fs';
import path from 'path';

async function main() {
  let httpsOptions;
  
  const certPath = 'C:\\Certs\\cert.pem';
  const keyPath  = 'C:\\Certs\\key.pem';
  const pfxPath  = 'C:\\Certs\\cert.pfx';

  if (fs.existsSync(pfxPath)) {
    // Se usou o script autoassinado novo, usamos o PFX para evitar erros do PowerShell
    httpsOptions = {
      pfx: fs.readFileSync(pfxPath),
      passphrase: 'temp-export-pass'
    };
    console.log('SSL PFX Certificate found. Starting in HTTPS mode.');
  } else if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    // Fica como fallback para Let's Encrypt / win-acme
    httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    console.log('SSL PEM Certificates found. Starting in HTTPS mode.');
  }

  const app = buildApp({ https: httpsOptions });
  const port = Number(process.env.PORT || 4001);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen({ port, host });
  
  const protocol = httpsOptions ? 'https' : 'http';
  app.log.info(`API running on ${protocol}://${host}:${port}`);
}

main().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});