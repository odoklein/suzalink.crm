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
  // Note: 'standalone' output is not recommended for Vercel as it can cause issues with Prisma binaries
  // Vercel uses serverless functions which handle dependencies differently
  poweredByHeader: false, // Remove X-Powered-By header for security
};

module.exports = nextConfig;
