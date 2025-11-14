/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost', // must match the URL exactly
        pathname: '/e-vuka/**', // allow all images in your bucket
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/media/**', // fallback for Django MEDIA_URL
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
