/**
 * 图片格式转换工具
 */

/**
 * 将图片 URL 转换为 WebP 格式
 * 只对 GitHub raw 链接添加 WebP 参数
 *
 * @param url 原始图片 URL
 * @returns WebP URL（如果支持）
 */
export function getWebPUrl(url: string): string {
  // 只对 GitHub raw 链接添加 WebP 参数
  if (url.includes('raw.githubusercontent.com')) {
    // 检查 URL 是否已有查询参数
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}format=webp`
  }

  // 其他 CDN 或链接保持不变
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
