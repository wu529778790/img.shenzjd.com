import { deleteFile, getSha } from '../../utils/github'

/**
 * DELETE /api/management/delete
 * 删除文件
 */
export default defineEventHandler(async (event) => {
  const auth = event.context.auth
  if (!auth) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  if (!body || !body.path) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少文件路径'
    })
  }

  const {
    path,
    repository = { owner: auth.login, name: 'img.shenzjd.com', branch: 'main' }
  } = body

  try {
    // 获取文件 SHA
    const sha = await getSha(
      repository.owner,
      repository.name,
      path,
      auth.githubToken,
      repository.branch
    )

    if (!sha) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Not Found',
        message: '文件不存在'
      })
    }

    // 删除文件
    const result = await deleteFile(
      repository.owner,
      repository.name,
      path,
      `Delete: ${path}`,
      sha,
      auth.githubToken,
      repository.branch
    )

    return {
      success: true,
      message: '文件已删除',
      commit: result.commit.sha
    }
  } catch (error: any) {
    console.error('Delete error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '删除失败: ' + (error.message || '未知错误')
    })
  }
})
