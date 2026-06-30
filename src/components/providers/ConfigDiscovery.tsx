'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useConfigCheck } from '@/hooks/useConfigCheck'
import { useSaveConfigToGitHub } from '@/hooks/useConfigSync'
import { toast } from 'sonner'
import { GitHubAPI } from '@/lib/github'
import { debugLog, debugError, debugWarn } from '@/lib/debug'

/**
 * 配置发现组件
 *
 * 功能：
 * 1. 登录后自动加载配置（只请求一次配置文件）
 * 2. 对比 GitHub 和本地的时间戳，哪个新用哪个
 * 3. 验证配置的仓库是否存在，不存在则清除配置并提示
 * 4. 更新 configStore
 *
 * 优化：
 * - 只请求 .imgx-config/config.json 一个文件
 * - 对比时间戳，避免不必要的更新
 * - 5 分钟 TTL 缓存
 */
export function ConfigDiscovery() {
  const { data: session, status } = useSession()
  const configStore = useConfigStore()
  const { checkConfig } = useConfigCheck()
  const saveMutation = useSaveConfigToGitHub()
  const validatedRef = useRef(false)
  const syncingRef = useRef(false)

  // 验证已配置的仓库是否存在
  async function validateConfiguredRepo() {
    if (validatedRef.current) return
    validatedRef.current = true

    const token = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
    const { owner, repo } = configStore
    if (!token || !owner || !repo) return

    try {
      const api = new GitHubAPI(token, owner, repo)
      await api.getRepo()
      debugLog('[ConfigDiscovery] Repo exists:', `${owner}/${repo}`)
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        debugLog('[ConfigDiscovery] Repo not found, clearing config:', `${owner}/${repo}`)
        configStore.resetConfig()
        localStorage.removeItem('config-storage')
        toast.warning('检测到图床仓库已被删除，请重新配置', {
          description: `仓库 ${owner}/${repo} 不存在，已清除本地配置`,
          duration: 6000,
        })
      }
    }
  }

  // 已登录时加载配置
  useEffect(() => {
    debugLog('[ConfigDiscovery] Effect fired:', { status, hasSession: !!session?.accessToken })
    if (status === 'authenticated' && session?.accessToken) {
      debugLog('[ConfigDiscovery] Starting checkConfig...')
      const t0 = performance.now()
      checkConfig().then((config) => {
        debugLog('[ConfigDiscovery] checkConfig resolved in', Math.round(performance.now() - t0), 'ms')
        if (config) {
          // 提取配置内容，排除内部字段
          const { _remoteUpdatedAt } = config

          // 检查是否有更新的远程配置
          let hasRemoteUpdate = false
          if (_remoteUpdatedAt && configStore.lastSyncAt) {
            const remoteTime = new Date(_remoteUpdatedAt).getTime()
            const localTime = new Date(configStore.lastSyncAt).getTime()
            hasRemoteUpdate = remoteTime > localTime
          }

          // 静默更新配置（不打扰用户）
          configStore.updateConfig({
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
            directory: config.directory || '',
            compressionEnabled: config.compressionEnabled ?? false,
            compressionQuality: config.compressionQuality ?? 80,
            watermarkEnabled: config.watermarkEnabled ?? false,
            watermarkText: config.watermarkText || '',
            watermarkColor: config.watermarkColor || '#ffffff',
            watermarkSize: config.watermarkSize ?? 24,
            watermarkPosition: config.watermarkPosition || 'bottom-right',
            theme: config.theme || 'system',
            cdn: config.cdn || 'jsdmirror',
            useRaw: config.useRaw ?? true,
            copyFormat: config.copyFormat || 'url',
            autoCopyAfterUpload: config.autoCopyAfterUpload ?? true,
            useOriginalFileName: config.useOriginalFileName ?? false,
            configPath: config.configPath || '.imgx-config/config.json',
            autoSync: config.autoSync ?? true,
            lastSyncAt: config.lastSyncAt,
            sha: config.sha,
          })

          // 只有当远程配置确实更新时，才通知用户
          if (hasRemoteUpdate) {
            toast.success(`配置已同步: ${config.owner}/${config.repo} (${config.branch})`, {
              duration: 3000,
            })
          }
        } else {
          // 远程配置不存在，确保本地使用正确的默认值
          configStore.updateConfig({
            compressionEnabled: false,
            cdn: 'jsdmirror',
          })
        }

        // 验证本地配置的仓库是否仍然存在（每次登录只验证一次）
        validateConfiguredRepo()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, checkConfig])

  // 自动同步配置到 GitHub
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return

    const handleConfigUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      console.log('[AutoSync] Event received:', !!detail, 'autoSync:', configStore.autoSync)
      if (!detail) return

      // 如果 autoSync 为 false，跳过
      if (configStore.autoSync === false) return

      // 防抖：避免短时间内多次保存
      if (syncingRef.current) {
        console.log('[AutoSync] Already syncing, skipping')
        return
      }
      syncingRef.current = true

      try {
        const { owner, repo, branch } = configStore
        if (!owner || !repo || !branch) return

        debugLog('[AutoSync] Saving config to GitHub...')
        const result = await saveMutation.mutateAsync()
        if (result.success) {
          debugLog('[AutoSync] Config saved successfully')
        } else {
          debugWarn('[AutoSync] Save failed:', result.message)
        }
      } catch {
        debugError('[AutoSync] Save error')
      } finally {
        syncingRef.current = false
      }
    }

    window.addEventListener('config-updated', handleConfigUpdate)
    return () => window.removeEventListener('config-updated', handleConfigUpdate)
  }, [status, session, configStore, saveMutation])

  return null
}
