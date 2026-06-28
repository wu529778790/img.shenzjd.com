import type { LinkOptions } from '@/types/image'

export function generateLink(options: LinkOptions): string {
  const { format, cdn, owner, repo, branch, path, fileName, useRaw = false } = options

  // 生成基础 URL
  let baseUrl: string

  switch (cdn) {
    case 'github':
      if (useRaw) {
        baseUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`
      } else {
        baseUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${path}`
      }
      break
    case 'jsdelivr':
      baseUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${path}`
      break
    case 'jsdmirror':
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
