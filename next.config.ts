import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 纯静态导出：无任何服务端逻辑（登录/上传/列表均为浏览器直连 GitHub API + wx-auth），
  // 产物 out/ 可同时托管到 GitHub Pages / Cloudflare Pages / Docker(nginx)
  output: 'export',
  trailingSlash: true,

  // 静态导出不支持 next/image 服务端优化，图片按原图直出
  images: {
    unoptimized: true,
  },
}

export default nextConfig
