import { createOrUpdateFile, getSha } from '../../utils/github'

/**
 * PUT /api/user/config
 * 保存用户配置到 GitHub 仓库
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
  if (!body || !body.config) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少配置数据'
    })
  }

  const {
    config,
    repository = { owner: auth.login, name: 'img.shenzjd.com', branch: 'main' }
  } = body

  try {
    const path = '.image-hosting/config.json'
    const content = JSON.stringify(config, null, 2)
    const message = 'Update config via Image Hosting App'

    // 获取现有文件的 SHA（如果存在）
    const sha = await getSha(
      repository.owner,
      repository.name,
      path,
      auth.githubToken,
      repository.branch
    )

    // 创建或更新文件
    const result = await createOrUpdateFile(
      repository.owner,
      repository.name,
      path,
      content,
      message,
      auth.githubToken,
      repository.branch,
      sha || undefined
    )

    return {
      success: true,
      message: '配置已保存',
      commit: result.commit.sha
    }
  } catch (error: any) {
    console.error('Save config error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '保存配置失败: ' + (error.message || '未知错误')
    })
  }
})
