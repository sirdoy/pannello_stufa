import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';
// @ts-expect-error — @next/bundle-analyzer ships CommonJS types not fully compatible with ESM import
import withBundleAnalyzer from '@next/bundle-analyzer';

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  cacheOnNavigation: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  reactCompiler: true, // Phase 71: auto-memoization via React Compiler 1.0
  env: {
    NEXT_PUBLIC_TEST_MODE: process.env.TEST_MODE || 'false',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 's.gravatar.com',
      },
    ],
  },
  // Next.js 16: Enable Turbopack in dev (PWA is disabled in dev anyway)
  // Build uses --webpack flag for PWA compatibility
  turbopack: {},
};

export default withAnalyzer(withSerwist(nextConfig));
