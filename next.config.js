/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  // Vercel optimizations
  output: 'standalone', // Optimized for Vercel deployment
  poweredByHeader: false, // Remove X-Powered-By header for security
};

module.exports = nextConfig;
