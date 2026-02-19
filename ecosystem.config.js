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
      script: 'dist/server.js',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'pgb-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start -p 3200',
      interpreter: 'node',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/web-error.log',
      out_file: './logs/web-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
