import type { LinkOptions } from '@/types/image'

export function generateLink(options: LinkOptions): string {
  const { format, cdn, owner, repo, branch, path, fileName, useRaw = false } = options

  // 生成基础 URL
  let baseUrl: string

  switch (cdn) {
    case 'github':
      if (useRaw) {
        // GitHub raw 链接 + WebP 格式参数
        baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`

        // GitHub Raw 支持动态 WebP 转换
        // 添加 ?format=webp 参数，GitHub 会自动转换为 WebP
        // 优点：不需要仓库里有 .webp 文件，动态转换
        const hasQuery = baseUrl.includes('?')
        baseUrl += hasQuery ? '&format=webp' : '?format=webp'
      } else {
        baseUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${path}`
      }
      break
    case 'jsdelivr':
      baseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`
      break
    case 'jsdmirror':
      // jsdmirror 不支持动态 WebP 转换
      // 它只是镜像 GitHub 文件，需要仓库里实际有 .webp 文件
      // 所以保持原图链接，避免 404
      baseUrl = `https://cdn.jsdmirror.com/gh/${owner}/${repo}@${branch}/${path}`
      break
    case 'github-pages':
      baseUrl = `https://${owner}.github.io/${repo}/${path}`
      break
    default:
      throw new Error(`Unsupported CDN: ${cdn}`)
  }

  // 根据格式生成链接
  switch (format) {
    case 'markdown':
      return `![${fileName}](${baseUrl})`
    case 'html':
      return `<img src="${baseUrl}" alt="${fileName}" />`
    case 'bbcode':
      return `[img]${baseUrl}[/img]`
    case 'url':
      return baseUrl
    default:
      return baseUrl
  }
}

export function generateLinks(
  paths: string[],
  baseOptions: Omit<LinkOptions, 'path'>
): string[] {
  return paths.map((path) => {
    const fileName = path.split('/').pop() || path
    return generateLink({
      ...baseOptions,
      path,
      fileName,
    })
  })
}
