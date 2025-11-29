/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.e-vuka.com",
        port: "",
        pathname: "/**",
      },

      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
        pathname: "/**",
      },

      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "",
        pathname: "/e-vuka/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "",
        pathname: "/media/**",
      },

      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
