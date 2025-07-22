/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/binance/:path*",
        destination: "https://api.binance.com/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
