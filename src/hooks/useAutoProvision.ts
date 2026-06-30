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
    watermarkEnabled: false,
    watermarkText: '',
    watermarkColor: '#ffffff',
    watermarkSize: 24,
    watermarkPosition: 'bottom-right',
    theme: 'system',
    cdn: 'jsdmirror',
    useRaw: true,
    copyFormat: 'url',
    autoCopyAfterUpload: true,
    useOriginalFileName: false,
    configPath: CONFIG_PATH,
    autoSync: true,
  }
}

/**
 * 自动配置：创建仓库 + 写入默认配置文件
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
    await api.createRepo(REPO_NAME, 'Free image hosting powered by img.shenzjd.com', false)
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

  // 3. 构建默认配置并写入 GitHub
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
