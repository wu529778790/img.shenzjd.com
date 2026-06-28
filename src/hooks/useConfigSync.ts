'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'

interface SaveConfigResponse {
  success: boolean
  message: string
  sha?: string
}

interface LoadConfigResponse {
  success: boolean
  config?: Config
  message?: string
}

/**
 * 保存配置到 GitHub
 */
async function saveConfigToGitHub(
  config: Config,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  sha?: string
): Promise<SaveConfigResponse> {
  const token = localStorage.getItem('github_token')
  if (!token) {
    return { success: false, message: '未找到 GitHub token' }
  }

  // 如果文件不存在（无 sha）且首次保存，先确保父目录存在
  if (!sha) {
    const dirPath = path.split('/').slice(0, -1).join('/')
    if (dirPath) {
      await ensureDirectoryExists(token, owner, repo, branch, dirPath)
    }
  }

  const configContent = JSON.stringify(config, null, 2)
  const contentBase64 = btoa(unescape(encodeURIComponent(configContent)))

  const body: any = {
    message: 'chore: update imgx config',
    content: contentBase64,
    branch,
  }

  // 如果提供了 SHA，说明是更新已有文件
  if (sha) {
    body.sha = sha
  }

  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json()
    return {
      success: false,
      message: error.message || '保存配置失败'
    }
  }

  const data = await response.json()
  return {
    success: true,
    message: '配置已保存到 GitHub',
    sha: data.content.sha,
  }
}

/**
 * 确保 GitHub 目录存在（通过创建占位文件）
 */
async function ensureDirectoryExists(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  dirPath: string
): Promise<void> {
  // 先检查目录是否已存在（通过尝试列出 .gitkeep）
  const keepPath = `${dirPath}/.gitkeep`
  const checkResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${keepPath}?ref=${branch}`,
    { headers: { 'Authorization': `token ${token}` } }
  )
  if (checkResponse.ok) return // 目录已存在

  // 创建 .gitkeep 占位文件来建立目录
  const contentBase64 = btoa('# imgx config directory\n')
  await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${keepPath}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'chore: create imgx config directory',
      content: contentBase64,
      branch,
    }),
  })
}

/**
 * 从 GitHub 加载配置
 */
async function loadConfigFromGitHub(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<LoadConfigResponse> {
  const token = localStorage.getItem('github_token')
  if (!token) {
    return { success: false, message: '未找到 GitHub token' }
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          'Authorization': `token ${token}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, message: '配置文件不存在' }
      }
      return { success: false, message: '加载配置失败' }
    }

    const data = await response.json()
    const content = decodeURIComponent(escape(atob(data.content)))
    const config = JSON.parse(content) as Config

    return { success: true, config }
  } catch (error) {
    return { success: false, message: '解析配置失败' }
  }
}

/**
 * Hook: 保存配置到 GitHub
 */
export function useSaveConfigToGitHub() {
  const queryClient = useQueryClient()
  const configStore = useConfigStore()

  return useMutation({
    mutationFn: async () => {
      const { owner, repo, branch } = configStore
      const configPath = configStore.configPath || '.imgx-config/config.json'

      if (!owner || !repo || !branch) {
        return { success: false, message: '请先配置 GitHub 仓库' }
      }

      const currentConfig = configStore as unknown as Config
      return saveConfigToGitHub(currentConfig, owner, repo, branch, configPath)
    },
    onSuccess: (result) => {
      if (result.success) {
        // 更新本地配置
        configStore.updateConfig({
          lastSyncAt: new Date().toISOString(),
          configPath: configStore.configPath || '.imgx-config/config.json',
        })
        // 更新 query cache
        queryClient.setQueryData(['config-sync'], result)
      }
    },
  })
}

/**
 * Hook: 从 GitHub 加载配置
 */
export function useLoadConfigFromGitHub() {
  const configStore = useConfigStore()

  return useQuery({
    queryKey: ['config-from-github', configStore.owner, configStore.repo, configStore.branch, configStore.configPath],
    queryFn: async () => {
      const { owner, repo, branch } = configStore
      const configPath = configStore.configPath || '.imgx-config/config.json'

      if (!owner || !repo || !branch) {
        return null
      }

      const result = await loadConfigFromGitHub(owner, repo, branch, configPath)
      return result.success ? result.config : null
    },
    enabled: !!(configStore.owner && configStore.repo && configStore.branch && configStore.configPath),
    staleTime: 60 * 1000, // 1 分钟
  })
}

/**
 * 检查 GitHub 配置是否存在
 */
export async function checkGitHubConfigExists(
  owner: string,
  repo: string,
  branch: string,
  path: string
): Promise<boolean> {
  const token = localStorage.getItem('github_token')
  if (!token) return false

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
      {
        headers: {
          'Authorization': `token ${token}`,
        },
      }
    )
    return response.ok
  } catch {
    return false
  }
}
