import { createOrUpdateFile, getSha } from '../../utils/github'

/**
 * PUT /api/upload/image
 * 上传图片到 GitHub
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
  if (!body || !body.content || !body.filename) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少必要参数'
    })
  }

  const {
    content, // Base64 编码的图片内容
    filename,
    repository = { owner: auth.login, name: 'img.shenzjd.com', branch: 'main' },
    directory = 'images',
    naming = { strategy: 'hash', prefix: '', suffix: '' },
    timestamp = Date.now()
  } = body

  try {
    // 1. 生成文件名
    let finalFilename = filename
    const ext = filename.split('.').pop()
    const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))

    if (naming.strategy === 'hash') {
      const hash = require('crypto').createHash('md5').update(content + timestamp).digest('hex').substring(0, 8)
      finalFilename = `${naming.prefix || ''}${hash}.${ext}`
    } else if (naming.strategy === 'timestamp') {
      finalFilename = `${naming.prefix || ''}${timestamp}.${ext}`
    } else if (naming.strategy === 'custom') {
      finalFilename = `${naming.prefix || ''}${nameWithoutExt}${naming.suffix || ''}.${ext}`
    }

    // 2. 生成路径（按日期自动分类）
    let finalPath = directory
    if (directory && directory !== 'root') {
      const date = new Date()
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      finalPath = `${directory}/${year}/${month}/${day}`
    }

    const fullPath = `${finalPath}/${finalFilename}`

    // 3. 检查文件是否已存在
    const existingSha = await getSha(
      repository.owner,
      repository.name,
      fullPath,
      auth.githubToken,
      repository.branch
    )

    if (existingSha) {
      // 如果文件已存在，添加时间戳避免冲突
      const timestampHash = require('crypto').createHash('md5').update(timestamp.toString()).digest('hex').substring(0, 6)
      const uniqueFilename = `${filename.split('.')[0]}_${timestampHash}.${ext}`
      finalPath = `${finalPath}/${uniqueFilename}`
    }

    // 4. 上传文件
    const result = await createOrUpdateFile(
      repository.owner,
      repository.name,
      fullPath,
      content, // Base64 内容，GitHub API 会自动解码
      `Upload: ${finalFilename}`,
      auth.githubToken,
      repository.branch,
      existingSha || undefined
    )

    // 5. 生成访问链接
    const rawUrl = `https://raw.githubusercontent.com/${repository.owner}/${repository.name}/${repository.branch}/${fullPath}`
    const githubUrl = `https://github.com/${repository.owner}/${repository.name}/blob/${repository.branch}/${fullPath}`
    const cdnUrl = `https://cdn.jsdelivr.net/gh/${repository.owner}/${repository.name}@${repository.branch}/${fullPath}`

    return {
      success: true,
      message: '上传成功',
      data: {
        filename: finalFilename,
        path: fullPath,
        sha: result.commit.sha,
        urls: {
          raw: rawUrl,
          github: githubUrl,
          cdn: cdnUrl
        }
      }
    }
  } catch (error: any) {
    console.error('Upload error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '上传失败: ' + (error.message || '未知错误')
    })
  }
})
