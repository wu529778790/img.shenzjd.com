import { getRepoContent } from '../../utils/github'

/**
 * GET /api/repo/contents
 * 获取仓库目录/文件内容
 */
export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const query = getQuery(event)
  const owner = query.owner as string
  const repo = query.repo as string
  const path = (query.path as string) || ''
  const ref = query.ref as string

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少 owner 或 repo 参数'
    })
  }

  try {
    const content = await getRepoContent(owner, repo, path, ref, auth.githubToken)

    return {
      success: true,
      data: content
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        success: true,
        data: null,
        message: '路径不存在'
      }
    }

    console.error('Get contents error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '获取内容失败'
    })
  }
})
