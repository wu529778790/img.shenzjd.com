import { createGitHubFetcher } from '../../utils/github'

/**
 * GET /api/user/config
 * 获取用户配置（从 GitHub 仓库读取）
 */
export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  // 从请求中获取配置的仓库信息（可选）
  const query = getQuery(event)
  const owner = (query.owner as string) || auth.login
  const repo = (query.repo as string) || 'img.shenzjd.com'
  const branch = (query.branch as string) || 'main'

  try {
    // 尝试从 GitHub 读取配置文件
    const fetcher = createGitHubFetcher(auth.githubToken)

    const configContent = await fetcher(
      `/repos/${owner}/${repo}/contents/.image-hosting/config.json`,
      {
        query: { ref: branch }
      }
    )

    // 解析 Base64 内容
    const content = Buffer.from(configContent.content, 'base64').toString('utf-8')
    const config = JSON.parse(content)

    return {
      success: true,
      data: config,
      source: 'github'
    }
  } catch (error: any) {
    // 如果配置文件不存在，返回默认配置
    if (error.response?.status === 404) {
      return {
        success: true,
        data: null,
        message: '配置文件不存在'
      }
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '读取配置失败'
    })
  }
})
