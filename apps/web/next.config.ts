import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vibe-crm/shared', '@vibe-crm/validators'],
};

export default nextConfig;
