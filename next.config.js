/** @type {import('next').NextConfig} */
const nextConfig = {
  // 移除 experimental.esmExternals 配置
  // 移除复杂的 webpack 配置，因为 Turbopack 不支持
  
  // 添加头部以支持 SharedArrayBuffer (WebLLM需要)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
