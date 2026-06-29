'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { GitHubAPI } from '@/lib/github'
import { toast } from 'sonner'
import type { Config } from '@/types/config'

interface DiscoveredConfig {
  owner: string
  repo: string
  branch: string
  configPath: string
}

/**
 * Hook: 发现用户 GitHub 仓库中的 ImgX 配置
 * 使用固定仓库名: img.shenzjd.com
 *
 * 触发条件：
 * 1. 已登录且未配置 → 发现并加载配置
 * 2. 已登录且已配置 → 从 GitHub 同步最新配置
 */
export function useConfigDiscovery() {
  const { data: session } = useSession()
  const configStore = useConfigStore()
  const queryClient = useQueryClient()

  const discoverAndLoadConfig = useCallback(async (): Promise<DiscoveredConfig | null> => {
    const token = session?.accessToken as string | undefined
    if (!token) {
      throw new Error('Not authenticated')
    }

    // 获取当前用户信息
    const api = new GitHubAPI(token, '', '')
    const currentUser = await api.getCurrentUser()
    const username = currentUser.login

    // 使用固定仓库名
    const repoName = 'img.shenzjd.com'
    const configPath = '.imgx-config/config.json'

    try {
      // 检查配置文件是否存在（使用配置的分支）
      const branch = configStore.branch || 'main'
      const configApi = new GitHubAPI(token, username, repoName, branch)
      await configApi.getFile(configPath, branch)

      // 文件存在，加载配置
      const fileData = await configApi.getFile(configPath, branch)
      const content = decodeURIComponent(escape(atob(fileData.content)))
      const config: Config = JSON.parse(content)

      // 对比本地配置和 GitHub 配置的更新时间
      const localLastSyncAt = configStore.lastSyncAt
      const remoteLastSyncAt = config.lastSyncAt

      // 判断是否需要更新本地配置
      const shouldUpdateLocal = (() => {
        // 本地没有配置 owner → 首次配置 → 使用 GitHub 配置
        if (!configStore.owner) return true

        // 本地没有同步时间 → 可能是旧版本数据 → 使用 GitHub 配置
        if (!localLastSyncAt) return true

        // GitHub 配置没有同步时间 → 可能是旧版本数据 → 使用 GitHub 配置
        if (!remoteLastSyncAt) return true

        // 对比时间戳：如果 GitHub 配置更新，则覆盖本地
        const localTime = new Date(localLastSyncAt).getTime()
        const remoteTime = new Date(remoteLastSyncAt).getTime()
        return remoteTime > localTime
      })()

      if (shouldUpdateLocal) {
        // GitHub 配置更新或本地未配置，使用 GitHub 配置
        configStore.updateConfig({
          owner: username,
          repo: repoName,
          branch: config.branch || 'main',
          directory: config.directory || '',
          compressionEnabled: config.compressionEnabled ?? true,
          compressionQuality: config.compressionQuality ?? 80,
          watermarkEnabled: config.watermarkEnabled ?? false,
          watermarkText: config.watermarkText || '',
          watermarkColor: config.watermarkColor || '#ffffff',
          watermarkSize: config.watermarkSize ?? 24,
          watermarkPosition: config.watermarkPosition || 'bottom-right',
          theme: config.theme || 'system',
          cdn: config.cdn || 'github',
          useRaw: config.useRaw ?? true,
          copyFormat: config.copyFormat || 'markdown',
          autoCopyAfterUpload: config.autoCopyAfterUpload ?? true,
          useOriginalFileName: config.useOriginalFileName ?? false,
          configPath: config.configPath || configPath,
          autoSync: config.autoSync ?? true,
          lastSyncAt: config.lastSyncAt,
          sha: config.sha,
        })

        toast.success(`已发现并加载配置: ${username}/${repoName}`)
      } else {
        // 本地配置更新，保留本地配置
        // 但确保 owner/repo/branch 等基础信息与 GitHub 一致
        configStore.updateConfig({
          owner: username,
          repo: repoName,
          branch: config.branch || configStore.branch || 'main',
          sha: config.sha,
        })

        toast.info('本地配置已更新，请同步到 GitHub')
      }

      // Invalidate相关查询以刷新数据
      queryClient.invalidateQueries({ queryKey: ['images'] })
      queryClient.invalidateQueries({ queryKey: ['repo-folders'] })
      queryClient.invalidateQueries({ queryKey: ['config-from-github'] })

      return {
        owner: username,
        repo: repoName,
        branch: config.branch || 'main',
        configPath: config.configPath || configPath,
      }
    } catch {
      // 配置文件不存在，用户可能还没有配置
      console.log('[ConfigDiscovery] Config not found, user may need to set up')
      return null
    }
  }, [session?.accessToken, configStore, queryClient])

  return useQuery({
    queryKey: ['discover-config', session?.user?.name || session?.user?.email],
    queryFn: discoverAndLoadConfig,
    // 已登录时始终尝试从 GitHub 同步配置（无论是否已有本地配置）
    // 这样可以确保刷新页面后获取到最新的配置
    enabled: !!session?.accessToken,
    staleTime: 60 * 1000, // 1 分钟内不重复请求
    gcTime: 5 * 60 * 1000, // 5 分钟后清理缓存
    retry: 0, // 不重试
  })
}
