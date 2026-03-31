import type { NextConfig } from 'next';

const securityHeaders = [
  // Protege contra clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Previne MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Força HTTPS por 1 ano
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Controla referrer leaking
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Restringe permissões do navegador
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Remove X-Powered-By (Next.js já faz, mas reforça)
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pgb/ui', '@pgb/sdk'],
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;