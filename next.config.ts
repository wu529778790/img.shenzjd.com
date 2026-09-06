import type { NextConfig } from 'next'

// GitHub Pages 项目站部署在 <域名>/<仓库名>/ 子路径下，需注入 basePath；
// Docker / Cloudflare Pages 部署在根路径，不设置该变量即为空
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

const nextConfig: NextConfig = {
  // 纯静态导出：无任何服务端逻辑（登录/上传/列表均为浏览器直连 GitHub API + wx-auth），
  // 产物 out/ 可同时托管到 GitHub Pages / Cloudflare Pages / Docker(nginx)
  output: 'export',
  trailingSlash: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  // 静态导出不支持 next/image 服务端优化，图片按原图直出
  images: {
    unoptimized: true,
  },
}

export default nextConfig
