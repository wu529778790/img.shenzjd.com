import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker 支持：启用 standalone 输出
  output: 'standalone',

  // P2 优化：静态资产缓存策略
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  images: {
    // P1 优化：启用 AVIF 和 WebP 格式（AVIF 比 WebP 小 20%）
    formats: ['image/avif', 'image/webp'],
    qualities: [75, 85],
    // P1 优化：响应式图片尺寸配置
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdmirror.com',
        pathname: '/**',
      },
    ],
  },
  // P3 优化：压缩配置
  compress: true,
  // P3 优化：生产环境移除 console
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  env: {
    // 自动将 GITHUB_CLIENT_ID 暴露给客户端
    // 这样只需要配置一个环境变量即可
    NEXT_PUBLIC_GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  },
}

export default nextConfig
