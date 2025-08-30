import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Central MinIO storage - primary image source
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
        pathname: '/**',
      },
      // Generic patterns for any WooCommerce site during sync
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/wp-content/uploads/**',
      },
      // Additional patterns for various WordPress hosting configurations
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/content/uploads/**',
      },
    ],
  },
};

export default nextConfig;
