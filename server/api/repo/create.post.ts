import { createRepository, checkRepositoryExists } from '../../utils/github'

/**
 * POST /api/repo/create
 * 创建新仓库
 */
export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    return {
      success: false,
      authenticated: false,
      message: '请先登录'
    }
  }

  const body = await readBody(event)
  const repoName = body?.name || 'img.shenzjd.com'
  const description = body?.description || 'Image hosting repository'
  const isPrivate = body?.private !== false

  try {
    // 检查仓库是否已存在
    const exists = await checkRepositoryExists(auth.login, repoName, auth.githubToken)

    if (exists) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Conflict',
        message: '仓库已存在'
      })
    }

    // 创建仓库
    const repo = await createRepository(repoName, description, auth.githubToken, isPrivate)

    return {
      success: true,
      message: '仓库创建成功',
      data: {
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        private: repo.private,
        defaultBranch: repo.default_branch
      }
    }
  } catch (error: any) {
    if (error.statusCode === 409) {
      throw error
    }

    console.error('Create repo error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '创建仓库失败: ' + (error.message || '未知错误')
    })
  }
})
