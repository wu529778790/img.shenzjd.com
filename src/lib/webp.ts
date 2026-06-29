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
 * 支持多种 CDN 和 GitHub raw 链接
 *
 * @param url 原始图片 URL
 * @returns WebP URL（如果支持）
 */
export function getWebPUrl(url: string): string {
  const cdnType = getCDNType(url)

  // GitHub raw 链接：添加 ?format=webp 参数
  if (cdnType === 'github-raw') {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}format=webp`
  }

  // jsDelivr 和 jsdmirror：替换文件扩展名为 .webp
  if (cdnType === 'jsdelivr' || cdnType === 'jsdmirror') {
    // 只对图片文件进行转换
    if (/\.(png|jpg|jpeg|gif|bmp|tiff?)$/i.test(url)) {
      return url.replace(/\.(png|jpg|jpeg|gif|bmp|tiff?)$/i, '.webp')
    }
    return url
  }

  // GitHub Pages 和其他链接：保持不变
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
