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
      // 检查配置文件是否存在
      const configApi = new GitHubAPI(token, username, repoName)
      await configApi.getFile(configPath)

      // 文件存在，加载配置
      const fileData = await configApi.getFile(configPath)
      const content = decodeURIComponent(escape(atob(fileData.content)))
      const config: Config = JSON.parse(content)

      // 更新配置到 store
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
    enabled: !!session?.accessToken && !configStore.owner, // 仅在已登录且未配置时运行
    staleTime: Infinity, // 配置发现结果永不过期
    gcTime: Infinity, // 缓存永不过期
    retry: 0, // 不重试
  })
}
