import type { LinkOptions } from '@/types/image'

export function generateLink(options: LinkOptions): string {
  const { format, cdn, owner, repo, branch, path, fileName, useRaw = true } = options

  // 生成基础 URL（先清理 path 中的查询参数）
  // 防止 path 已经包含 ?format=webp 导致重复
  const cleanPath = path.split('?')[0]
  let baseUrl: string

  switch (cdn) {
    case 'github':
      if (useRaw) {
        // GitHub raw 链接 + WebP 格式参数
        baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`

        // GitHub Raw 支持动态 WebP 转换
        // 添加 ?format=webp 参数，GitHub 会自动转换为 WebP
        // 优点：不需要仓库里有 .webp 文件，动态转换
        const hasQuery = baseUrl.includes('?')
        baseUrl += hasQuery ? '&format=webp' : '?format=webp'
      } else {
        baseUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${cleanPath}`
      }
      break
    case 'jsdelivr':
      baseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${cleanPath}`
      break
    case 'jsdmirror':
      // jsdmirror 不支持动态 WebP 转换
      // 它只是镜像 GitHub 文件，需要仓库里实际有 .webp 文件
      // 所以保持原图链接，避免 404
      baseUrl = `https://cdn.jsdmirror.com/gh/${owner}/${repo}@${branch}/${cleanPath}`
      break
    case 'github-pages':
      baseUrl = `https://${owner}.github.io/${repo}/${cleanPath}`
      break
    case 'statically':
      baseUrl = `https://cdn.statically.io/gh/${owner}/${repo}/${branch}/${cleanPath}`
      break
    case 'jsd-onmicrosoft':
      baseUrl = `https://jsd.onmicrosoft.cn/gh/${owner}/${repo}@${branch}/${cleanPath}`
      break
    case 'gitmirror':
      baseUrl = `https://raw.gitmirror.com/${owner}/${repo}/${branch}/${cleanPath}`
      break
    case 'ghproxy':
      baseUrl = `https://ghproxy.com/https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${cleanPath}`
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

