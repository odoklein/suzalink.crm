/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
