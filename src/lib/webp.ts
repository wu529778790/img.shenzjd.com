/**
 * 图片格式转换工具
 */

/**
 * 识别 CDN 类型
 */
function getCDNType(url: string): string {
  if (url.includes('raw.githubusercontent.com')) return 'github-raw'
  if (url.includes('cdn.jsdelivr.net/gh')) return 'jsdelivr'
  if (url.includes('cdn.jsdmirror.com/gh')) return 'jsdmirror'
  if (url.includes('.github.io')) return 'github-pages'
  return 'unknown'
}

/**
 * 将图片 URL 转换为 WebP 格式
 *
 * ⚠️  重要说明：
 * 只有 GitHub Raw 支持动态 WebP 转换
 * 其他 CDN（jsdmirror, jsdelivr, github-pages）需要实际 .webp 文件
 *
 * 支持动态 WebP 转换的 CDN：
 * - GitHub Raw: raw.githubusercontent.com
 *   使用 ?format=webp 参数，GitHub 自动转换
 *
 * 不支持动态转换的 CDN：
 * - jsdmirror: 只镜像 GitHub 文件，需要 .webp 文件
 * - jsdelivr: 理论上支持，但需要测试验证
 * - GitHub Pages: 静态托管，不支持动态转换
 *
 * @param url 原始图片 URL
 * @returns WebP URL（仅 GitHub Raw）
 */
export function getWebPUrl(url: string): string {
  const cdnType = getCDNType(url)

  // GitHub Raw: 支持动态 WebP 转换
  if (cdnType === 'github-raw') {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}format=webp`
  }

  // jsDelivr / jsdmirror / GitHub Pages:
  // 不支持动态转换，保持原图
  // 原因：需要仓库里实际有 .webp 文件

  return url
}

/**
 * 检查浏览器是否支持 WebP
 * @returns boolean
 */
export function checkWebPSupport(): boolean {
  if (typeof window === 'undefined') return true

  const canvas = document.createElement('canvas')
  if (!canvas.toBlob) return false

  // 测试 WebP 支持
  return canvas.toBlob(
    () => {},
    'image/webp',
    0.5
  ) !== null
}
