'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'
import { debugLog, debugError, debugWarn } from '@/lib/debug'

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
 * 使用 TextEncoder/TextDecoder 进行 UTF-8 安全的 base64 编解码
 * 替代已废弃的 escape/unescape，避免非 ASCII 字符损坏
 */
function encodeConfigToBase64(content: string): string {
  const bytes = new TextEncoder().encode(content)
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('')
  return btoa(binary)
}

function decodeConfigFromBase64(base64: string): string {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * 保存配置到 GitHub（使用 Git Data API，自动处理目录创建）
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

  const configContent = JSON.stringify(config, null, 2)
  const contentBase64 = encodeConfigToBase64(configContent)

  // 编码路径（处理 .imgx-config 等含特殊字符的路径）
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`

  // 如果没有 sha，先尝试获取远程文件 sha（文件已存在时必须传 sha 才能更新）
  let effectiveSha = sha
  if (!effectiveSha) {
    try {
      const existing = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: { 'Authorization': `token ${token}` },
      })

      if (existing.ok) {
        const existingData = await existing.json()
        effectiveSha = existingData.sha
      } else if (existing.status === 404) {
        // 文件不存在，继续创建
        debugLog('[ConfigSync] Remote config not found (404), will create')
      } else {
        debugWarn('[ConfigSync] Unexpected response when checking remote config:', existing.status)
      }
    } catch (err) {
      // 网络错误，记录日志后继续尝试创建
      debugWarn('[ConfigSync] Network error when checking remote config:', err)
    }
  }

  const body: { message: string; content: string; branch: string; sha?: string } = {
    message: 'chore: update imgx config',
    content: contentBase64,
    branch,
  }

  if (effectiveSha) {
    body.sha = effectiveSha
  }

  const response = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
    debugError('[ConfigSync] Save failed:', response.status, error)
    return {
      success: false,
      message: error.message || `保存配置失败 (${response.status})`
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
    // 编码路径（.imgx-config 含点号需编码）
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`,
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
    const content = decodeConfigFromBase64(data.content)
    const config = JSON.parse(content) as Config

    return { success: true, config }
  } catch {
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

      // 只提取 Config 接口定义的字段，排除 store 的方法（updateConfig / resetConfig）
      const currentConfig: Config = {
        owner, repo, branch,
        directory: configStore.directory,
        compressionEnabled: configStore.compressionEnabled,
        compressionQuality: configStore.compressionQuality,
        watermarkEnabled: configStore.watermarkEnabled,
        watermarkText: configStore.watermarkText,
        watermarkColor: configStore.watermarkColor,
        watermarkSize: configStore.watermarkSize,
        watermarkPosition: configStore.watermarkPosition,
        theme: configStore.theme,
        cdn: configStore.cdn,
        useRaw: configStore.useRaw,
        copyFormat: configStore.copyFormat,
        autoCopyAfterUpload: configStore.autoCopyAfterUpload,
        useOriginalFileName: configStore.useOriginalFileName,
        configPath: configStore.configPath,
        autoSync: configStore.autoSync,
        lastSyncAt: configStore.lastSyncAt,
        sha: configStore.sha,
      }
      return saveConfigToGitHub(currentConfig, owner, repo, branch, configPath)
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('[AutoSync] Save success, updating lastSyncAt and sha')
        // ✅ 直接更新内部状态，不走 updateConfig 的事件通道，
        // 避免触发 config-updated 事件导致无限循环
        useConfigStore.setState({
          lastSyncAt: new Date().toISOString(),
          sha: result.sha,
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
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${branch}`,
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
