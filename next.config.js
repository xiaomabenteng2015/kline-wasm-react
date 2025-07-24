/** @type {import('next').NextConfig} */
const nextConfig = {
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
  
  // 添加 webpack 配置以支持 @xenova/transformers
  webpack: (config, { isServer }) => {
    // 处理 @xenova/transformers 的依赖
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "path": false,
      "crypto": false,
    };
    
    // 排除服务端渲染的问题模块
    if (isServer) {
      config.externals.push('@xenova/transformers');
    }
    
    return config;
  },
  
  // 实验性功能配置
  experimental: {
    esmExternals: 'loose'
  }
};

module.exports = nextConfig;
