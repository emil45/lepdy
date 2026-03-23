import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://lepdy-c29da.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default withNextIntl(nextConfig);
