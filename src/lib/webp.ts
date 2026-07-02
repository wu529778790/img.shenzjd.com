/**
 * 图片格式转换工具
 */

/**
 * 将图片 URL 转换为 WebP 格式
 *
 * ⚠️  重要说明：
 * 只有 GitHub Raw 支持动态 WebP 转换
 * 其他 CDN（jsdmirror, jsdelivr, github-pages）需要实际 .webp 文件
 *
 * @param url 原始图片 URL
 * @param isImage 仅当 true 时追加 ?format=webp；非图片文件跳过，避免 next/image 解码失败
 * @returns WebP URL（仅 GitHub Raw，且仅图片）
 */
export function getWebPUrl(url: string, isImage = true): string {
  if (!isImage) return url;
  // GitHub Raw: 支持动态 WebP 转换
  if (url.includes('raw.githubusercontent.com')) {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}format=webp`
  }

  // jsDelivr / jsdmirror / GitHub Pages:
  // 不支持动态转换，保持原图
  // 原因：需要仓库里实际有 .webp 文件

  return url
}
