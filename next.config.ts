import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { version } from './package.json';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Expose the package.json version to the client so the UI can display it.
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
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
