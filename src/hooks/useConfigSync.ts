'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useConfigStore } from '@/stores/configStore'
import type { Config } from '@/types/config'
import { debugLog, debugError, debugWarn } from '@/lib/debug'
import { tryGetCredential } from '@/hooks/useWxAuthSession'

interface SaveConfigResponse {
  success: boolean
  message: string
  sha?: string
}

/** 配置文件固定存放在 main 分支，与数据分支（用户可在设置里切换）解耦，避免 sha 跨分支错乱 */
export const CONFIG_BRANCH = 'main'

interface LoadConfigResponse {
  success: boolean
  config?: Config
  message?: string
}

/**
 * 使用 TextEncoder/TextDecoder 进行 UTF-8 安全的 base64 编解码
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
export async function saveConfigToGitHub(
  config: Config,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  sha?: string,
  token?: string
): Promise<SaveConfigResponse> {
  if (!token) {
    return { success: false, message: '未找到 GitHub token' }
  }

  const configContent = JSON.stringify(config, null, 2)
  const contentBase64 = encodeConfigToBase64(configContent)

  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}`

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
        debugLog('[ConfigSync] Remote config not found (404), will create')
      } else {
        debugWarn('[ConfigSync] Unexpected response when checking remote config:', existing.status)
      }
    } catch (err) {
      debugWarn('[ConfigSync] Network error when checking remote config:', err)
    }
  }

  const body: { message: string; content: string; branch: string; sha?: string } = {
    message: 'chore: update config by https://img.shenzjd.com',
    content: contentBase64,
    branch,
  }

  if (effectiveSha) {
    body.sha = effectiveSha
  }

  const doPut = (sha?: string) =>
    fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sha ? { ...body, sha } : body),
    })

  let response = await doPut(effectiveSha)
  if (response.status === 409) {
    // sha 过期/错位（例如配置路径迁移后残留了旧路径文件的 sha）：重读远端真实状态自愈一次
    debugWarn('[ConfigSync] 409 conflict, refetching remote state and retrying once')
    try {
      const existing = await fetch(`${apiUrl}?ref=${branch}`, {
        headers: { 'Authorization': `token ${token}` },
      })
      if (existing.ok) {
        // 文件存在 → 用远端最新 sha 覆盖
        const existingData = await existing.json()
        response = await doPut(existingData.sha)
      } else if (existing.status === 404) {
        // 文件实际不存在（残留 sha 属于其他路径）→ 降级为新建
        response = await doPut()
      }
    } catch (retryErr) {
      debugWarn('[ConfigSync] 409 retry failed:', retryErr)
    }
  }

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
  path: string,
  token?: string
): Promise<LoadConfigResponse> {
  if (!token) {
    return { success: false, message: '未找到 GitHub token' }
  }

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

  const mutation = useMutation({
    mutationFn: async () => {
      // 实时读取最新配置（避免 mutation 闭包捕获旧 branch）
      const cfg = useConfigStore.getState()
      const { owner, repo } = cfg
      const configPath = cfg.configPath || '.img.shenzjd.com/config.json'

      if (!owner || !repo) {
        return { success: false, message: 'wx-auth 尚未就绪或仓库未开通' }
      }

      // wx-auth 领取短命 installation token（会话内缓存）
      const cred = await tryGetCredential()
      if (!cred) {
        return { success: false, message: '未登录或 GitHub 能力未就绪' }
      }

      // branch 仅作为数据分支偏好写入 JSON 内容；文件本身固定写到 main
      const currentConfig: Config = {
        owner, repo, branch: cfg.branch,
        directory: cfg.directory,
        compressionEnabled: cfg.compressionEnabled,
        compressionQuality: cfg.compressionQuality,
        watermarkEnabled: cfg.watermarkEnabled,
        watermarkText: cfg.watermarkText,
        watermarkColor: cfg.watermarkColor,
        watermarkSize: cfg.watermarkSize,
        watermarkPosition: cfg.watermarkPosition,
        theme: cfg.theme,
        cdn: cfg.cdn,
        useRaw: cfg.useRaw,
        copyFormat: cfg.copyFormat,
        autoCopyAfterUpload: cfg.autoCopyAfterUpload,
        useOriginalFileName: cfg.useOriginalFileName,
        convertToWebp: cfg.convertToWebp,
        configPath: cfg.configPath,
        autoSync: cfg.autoSync,
        lastSyncAt: cfg.lastSyncAt,
        sha: cfg.sha,
      }
      return saveConfigToGitHub(currentConfig, owner, repo, CONFIG_BRANCH, configPath, cfg.sha, cred.token)
    },
    onSuccess: (result) => {
      if (result.success) {
        console.log('[AutoSync] Save success, updating lastSyncAt and sha')
        useConfigStore.setState({
          lastSyncAt: new Date().toISOString(),
          sha: result.sha,
        })
        queryClient.setQueryData(['config-sync'], result)
      }
    },
  })

  // ✅ 返回稳定的引用：mutateAsync 本身是稳定的，
  // 包装在 useCallback 中确保引用不变，防止消费方 useEffect 反复触发
  return { ...mutation, mutateAsync: mutation.mutateAsync }
}

/**
 * Hook: 从 GitHub 加载配置
 */
export function useLoadConfigFromGitHub() {
  const configStore = useConfigStore()

  return useQuery({
    // 配置固定读 main 分支，key 不含数据分支（切数据分支不应触发配置重读）
    queryKey: ['config-from-github', configStore.owner, configStore.repo, configStore.configPath],
    queryFn: async () => {
      const { owner, repo } = configStore
      const configPath = configStore.configPath || '.img.shenzjd.com/config.json'

      if (!owner || !repo) {
        return null
      }

      const cred = await tryGetCredential()
      if (!cred) return null

      const result = await loadConfigFromGitHub(owner, repo, CONFIG_BRANCH, configPath, cred.token)
      return result.success ? result.config : null
    },
    enabled: !!(configStore.owner && configStore.repo && configStore.configPath),
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
  path: string,
  token?: string
): Promise<boolean> {
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
