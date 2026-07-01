'use client'

import { useCallback } from 'react'
import { GitHubAPI } from '@/lib/github'
import { saveConfigToGitHub } from '@/hooks/useConfigSync'
import { debugError } from '@/lib/debug'
import type { Config } from '@/types/config'

const REPO_NAME = 'img.shenzjd.com'
const REPO_BRANCH = 'main'
const CONFIG_PATH = '.imgx-config/config.json'

function getDefaultConfig(owner: string): Config {
  return {
    owner,
    repo: REPO_NAME,
    branch: REPO_BRANCH,
    directory: '',
    compressionEnabled: false,
    compressionQuality: 80,
    watermarkEnabled: true,
    watermarkText: 'by img.shenzjd.com',
    watermarkColor: '#ffffff',
    watermarkSize: 24,
    watermarkPosition: 'bottom-right',
    theme: 'system',
    cdn: 'jsdmirror',
    useRaw: true,
    copyFormat: 'url',
    autoCopyAfterUpload: true,
    useOriginalFileName: false,
    convertToWebp: true,
    configPath: CONFIG_PATH,
    autoSync: true,
  }
}

// README 宣传文案
const README_CONTENT = `# 🚀 img.shenzjd.com

> **现代化的免费图床服务** — 上传即用，全球加速。

👉 立即体验：[**img.shenzjd.com**](https://img.shenzjd.com/)

---

## ✨ 为什么选择 img.shenzjd.com？

- 🔗 **Markdown / HTML / BBCode / 纯链接** — 一键复制，无缝嵌入
- 📦 **批量拖拽上传** — 支持粘贴、批量处理
- 🗜️ **智能压缩** — 自动优化图片，节省带宽
- 🌐 **多 CDN 加速** — GitHub Raw / jsDelivr / jsDMirror / GitHub Pages
- 🎨 **水印保护** — 自定义文字水印，保护原创内容
- ⚡ **零配置上手** — GitHub 账号登录即用，无需额外设置

---

📦 本仓库由 [img.shenzjd.com](https://img.shenzjd.com/) 自动创建并管理
`

/**
 * 自动配置：创建仓库 + 写入 README + 写入默认配置文件
 * 返回配置对象供 store 更新，失败返回 null
 */
async function autoProvisionConfig(): Promise<Config | null> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
  if (!token) return null

  // 1. 获取当前用户
  const api = new GitHubAPI(token, '', '')
  const currentUser = await api.getCurrentUser()
  const username = currentUser.login

  // 2. 尝试创建仓库（422 = 已存在，忽略错误）
  try {
    await api.createRepo(REPO_NAME, 'Free image hosting powered by https://img.shenzjd.com', false)
  } catch (err) {
    const status = (err as { response?: { status?: number } })?.response?.status
    if (status === 422) {
      // 仓库已存在，忽略
    } else if (status !== undefined) {
      // 其他 API 错误（如 403 权限不足），抛出让上层处理
      throw err
    }
    // 网络错误（无 response）也忽略，可能是暂时的
  }

  // 3. 写入 README（宣传文案）
  try {
    const repoApi = new GitHubAPI(token, username, REPO_NAME, REPO_BRANCH)
    const readmeBlob = new Blob([README_CONTENT], { type: 'text/plain' })
    await repoApi.createOrUpdateFile('README.md', readmeBlob, 'docs: init README [skip ci]')
  } catch (err) {
    // README 写入失败不影响核心功能，仅记录日志
    debugError('[AutoProvision] Failed to write README:', err)
  }

  // 4. 构建默认配置并写入 GitHub
  const config = getDefaultConfig(username)
  const result = await saveConfigToGitHub(config, username, REPO_NAME, REPO_BRANCH, CONFIG_PATH)

  if (!result.success) {
    debugError('[AutoProvision] Failed to save config:', result.message)
    return null
  }

  return config
}

export function useAutoProvision() {
  const provision = useCallback(async (): Promise<Config | null> => {
    try {
      return await autoProvisionConfig()
    } catch (error) {
      debugError('[AutoProvision] Error:', error)
      return null
    }
  }, [])

  return { provision }
}
