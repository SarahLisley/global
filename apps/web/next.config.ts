import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pgb/ui', '@pgb/sdk'],
};

export default nextConfig;