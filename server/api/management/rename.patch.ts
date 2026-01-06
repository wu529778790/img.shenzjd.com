import { createOrUpdateFile, deleteFile } from '../../utils/github'
import { ofetch } from 'ofetch'

/**
 * PATCH /api/management/rename
 * 重命名文件（通过删除旧文件并创建新文件）
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
  if (!body || !body.oldPath || !body.newPath) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少路径参数'
    })
  }

  const {
    oldPath,
    newPath,
    repository = { owner: auth.login, name: 'img.shenzjd.com', branch: 'main' }
  } = body

  try {
    // 1. 获取旧文件内容和 SHA
    const fetcher = ofetch.create({
      baseURL: 'https://api.github.com',
      headers: {
        Authorization: `Bearer ${auth.githubToken}`,
        Accept: 'application/vnd.github+json'
      }
    })

    const oldContent = await fetcher(
      `/repos/${repository.owner}/${repository.name}/contents/${encodeURIComponent(oldPath)}`,
      { query: { ref: repository.branch } }
    )

    // 2. 下载文件内容
    const fileContent = await ofetch(oldContent.download_url, {
      responseType: 'text'
    })

    // 3. 创建新文件
    const createResult = await createOrUpdateFile(
      repository.owner,
      repository.name,
      newPath,
      fileContent,
      `Rename: ${oldPath} -> ${newPath}`,
      auth.githubToken,
      repository.branch
    )

    // 4. 删除旧文件
    const deleteResult = await deleteFile(
      repository.owner,
      repository.name,
      oldPath,
      `Delete old file after rename: ${oldPath}`,
      oldContent.sha,
      auth.githubToken,
      repository.branch
    )

    return {
      success: true,
      message: '文件已重命名',
      data: {
        oldPath,
        newPath,
        commit: {
          create: createResult.commit.sha,
          delete: deleteResult.commit.sha
        }
      }
    }
  } catch (error: any) {
    console.error('Rename error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '重命名失败: ' + (error.message || '未知错误')
    })
  }
})
