import { getRepoBranches } from '../../utils/github'

/**
 * GET /api/repo/branches
 * 获取仓库分支列表
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

  const query = getQuery(event)
  const owner = query.owner as string
  const repo = query.repo as string

  if (!owner || !repo) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少 owner 或 repo 参数'
    })
  }

  try {
    const branches = await getRepoBranches(owner, repo, auth.githubToken)

    const formattedBranches = branches.map((branch: any) => ({
      name: branch.name,
      commit: branch.commit.sha
    }))

    return {
      success: true,
      data: formattedBranches
    }
  } catch (error: any) {
    console.error('Get branches error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '获取分支列表失败'
    })
  }
})
