import { getRepoContent } from '../../utils/github'

/**
 * GET /api/management/list
 * 获取文件列表
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

    if (Array.isArray(content)) {
      // 目录，返回文件列表
      const files = content
        .filter(item => item.type === 'file')
        .map(item => ({
          name: item.name,
          path: item.path,
          size: item.size,
          downloadUrl: item.download_url,
          sha: item.sha
        }))

      const directories = content
        .filter(item => item.type === 'dir')
        .map(item => ({
          name: item.name,
          path: item.path
        }))

      return {
        success: true,
        data: {
          files,
          directories
        }
      }
    } else {
      // 单个文件
      return {
        success: true,
        data: {
          file: {
            name: content.name,
            path: content.path,
            size: content.size,
            downloadUrl: content.download_url,
            sha: content.sha
          }
        }
      }
    }
  } catch (error: any) {
    if (error.response?.status === 404) {
      return {
        success: true,
        data: {
          files: [],
          directories: []
        },
        message: '路径不存在或为空'
      }
    }

    console.error('Get list error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '获取文件列表失败'
    })
  }
})
