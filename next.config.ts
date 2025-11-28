/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // <--- CRITICAL for the Dockerfile I gave you
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // --- Production Storage (MinIO) ---
      {
        protocol: 'https',
        hostname: 'storage.e-vuka.com',
        port: '',
        pathname: '/**', // Allows accessing all buckets (e-vuka, e-vuka-static, etc.)
      },
      // --- Local Development (Keep these for testing) ---
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/e-vuka/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/media/**',
      },
      // --- External Placeholders ---
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;