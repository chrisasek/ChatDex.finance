import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(import.meta.dirname, '../..'),
  transpilePackages: [
    '@chatdex/shared',
    '@chatdex/intents',
    '@chatdex/markets',
    '@chatdex/trading',
    '@chatdex/core',
    '@chatdex/database',
    '@chatdex/whatsapp'
  ],
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'DENY' }
    ] }];
  }
};

export default nextConfig;
