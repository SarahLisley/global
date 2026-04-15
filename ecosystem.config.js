// PM2 Ecosystem Config — Portal Global Bravo
// Uso: pm2 start ecosystem.config.js
// Logs: pm2 logs
// Status: pm2 status
// Reiniciar: pm2 restart all
// Parar: pm2 stop all
// Iniciar no boot: pm2 save && pm2-startup install

module.exports = {
  apps: [
    {
      name: 'pgb-api',
      cwd: './apps/api',
      script: 'npx.cmd',
      args: 'tsx src/server.ts',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=1024',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'pgb-web',
      cwd: './apps/web',
      script: 'pnpm.cmd',
      args: 'dev -p 3200',
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        NODE_OPTIONS: '--max-old-space-size=4096',
        NEXT_PRIVATE_LOCAL_SKIP_SYMLINK: '1',
      },
      autorestart: true,
      watch: false,
      max_memory_restart: '4G',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
