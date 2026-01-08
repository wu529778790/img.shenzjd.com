import { createOrUpdateFile } from '../../utils/github'

/**
 * POST /api/repo/init
 * 初始化仓库（创建必要的目录结构和配置文件）
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
  const {
    owner = auth.login,
    repo = 'img.shenzjd.com',
    branch = 'main'
  } = body

  try {
    const results = []

    // 1. 创建 .gitignore
    const gitignoreContent = `# Image Hosting
.image-hosting/
.DS_Store
Thumbs.db

# Logs
*.log

# Temp files
*.tmp
*.temp
`
    const gitignore = await createOrUpdateFile(
      owner,
      repo,
      '.gitignore',
      gitignoreContent,
      'Initialize: Add .gitignore',
      auth.githubToken,
      branch
    )
    results.push({ file: '.gitignore', sha: gitignore.commit.sha })

    // 2. 创建 README.md
    const readmeContent = `# Image Hosting Repository

This repository is used for image hosting via [Image Hosting App](https://img.shenzjd.com).

## Structure

- \`.image-hosting/\` - Configuration directory
- \`images/\` - Image storage directory (default)

## Configuration

Configuration is stored in \`.image-hosting/config.json\` and can be managed through the app.

## Usage

1. Login to the app with GitHub
2. Configure your storage preferences
3. Upload images
4. Get shareable links

---

*Managed by Image Hosting App*
`
    const readme = await createOrUpdateFile(
      owner,
      repo,
      'README.md',
      readmeContent,
      'Initialize: Add README.md',
      auth.githubToken,
      branch
    )
    results.push({ file: 'README.md', sha: readme.commit.sha })

    // 3. 创建默认配置文件
    const defaultConfig = {
      version: '3.0.0',
      storage: {
        repository: {
          owner,
          name: repo,
          branch
        },
        directory: {
          mode: 'auto',
          path: 'images',
          autoPattern: 'year/month/day'
        },
        naming: {
          strategy: 'hash',
          prefix: '',
          suffix: ''
        }
      },
      image: {
        autoCompress: true,
        compressionQuality: 0.85,
        maxWidth: 1920,
        maxHeight: 1080,
        watermark: {
          enabled: false,
          text: '',
          position: 'bottom-right',
          opacity: 0.5
        }
      },
      links: {
        format: 'markdown',
        cdn: 'github',
        customDomain: ''
      },
      user: {
        id: auth.id,
        login: auth.login,
        email: auth.email,
        avatar: auth.avatarUrl
      },
      lastSync: new Date().toISOString()
    }

    const config = await createOrUpdateFile(
      owner,
      repo,
      '.image-hosting/config.json',
      JSON.stringify(defaultConfig, null, 2),
      'Initialize: Add configuration',
      auth.githubToken,
      branch
    )
    results.push({ file: '.image-hosting/config.json', sha: config.commit.sha })

    return {
      success: true,
      message: '仓库初始化完成',
      data: results
    }
  } catch (error: any) {
    console.error('Init repo error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '初始化仓库失败: ' + (error.message || '未知错误')
    })
  }
})
