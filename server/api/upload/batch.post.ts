/**
 * POST /api/upload/batch
 * 批量上传图片
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
  if (!body || !Array.isArray(body.files) || body.files.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少文件列表'
    })
  }

  const { files, repository, directory, naming } = body

  // 串行上传（避免 GitHub API 速率限制）
  const results = []
  const errors = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      // 调用单个上传接口
      const response = await $fetch('/api/upload/image', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.githubToken}`
        },
        body: {
          content: file.content,
          filename: file.filename,
          repository,
          directory,
          naming,
          timestamp: Date.now() + i
        }
      })

      results.push(response.data)
    } catch (error: any) {
      errors.push({
        filename: file.filename,
        error: error.message || '上传失败'
      })
    }
  }

  return {
    success: errors.length === 0,
    message: errors.length === 0 ? '全部上传成功' : `部分上传成功，${errors.length} 个失败`,
    data: {
      success: results,
      failed: errors
    }
  }
})
