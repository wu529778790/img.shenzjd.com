import { getUserRepos } from '../../utils/github'

/**
 * GET /api/repo/list
 * 获取用户仓库列表
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

  try {
    const repos = await getUserRepos(auth.githubToken)

    // 过滤并格式化仓库列表
    const formattedRepos = repos.map((repo: any) => ({
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      defaultBranch: repo.default_branch,
      description: repo.description
    }))

    return {
      success: true,
      data: formattedRepos
    }
  } catch (error: any) {
    console.error('Get repos error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '获取仓库列表失败'
    })
  }
})
