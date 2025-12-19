import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pgb/ui', '@pgb/sdk'],
  experimental: {
    optimizePackageImports: ['@pgb/ui'],
  },
};

export default nextConfig;