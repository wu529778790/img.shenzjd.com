'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useConfigCheck } from '@/hooks/useConfigCheck'
import { useSaveConfigToGitHub } from '@/hooks/useConfigSync'
import { useAutoProvision } from '@/hooks/useAutoProvision'
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
  const { mutateAsync: saveMutateAsync } = useSaveConfigToGitHub()
  const { provision } = useAutoProvision()
  const validatedRef = useRef(false)
  const syncingRef = useRef(false)
  const loadingRef = useRef(false)
  const checkedSessionRef = useRef<string>('')

  // ✅ 用 ref 持有最新的 configStore，避免将其放入依赖数组导致 effect 反复触发
  const configStoreRef = useRef(configStore)
  useEffect(() => {
    configStoreRef.current = configStore
  })

  // 验证已配置的仓库是否存在
  async function validateConfiguredRepo() {
    if (validatedRef.current) return
    validatedRef.current = true

    const token = typeof window !== 'undefined' ? localStorage.getItem('github_token') : null
    const { owner, repo } = configStoreRef.current
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
    // ✅ 双重保护：
    // 1. checkedSessionRef: 同一 session 只检查一次，防止 effect 重复触发
    // 2. loadingRef: 防止上一次还没完成时并发执行
    const sessionKey = session?.accessToken || status
    if (checkedSessionRef.current === sessionKey) return
    if (loadingRef.current) return

    if (status === 'authenticated' && session?.accessToken) {
      checkedSessionRef.current = sessionKey
      loadingRef.current = true
      checkConfig().then(async (config) => {
        try {
          const store = configStoreRef.current
          const wasInitialized = store.configInitialized

          if (config) {
            const { _remoteUpdatedAt } = config

            // 只有之前已初始化过，且远程确实比本地新，才算"更新"
            let hasRemoteUpdate = false
            if (wasInitialized && _remoteUpdatedAt && store.lastSyncAt) {
              const remoteTime = new Date(_remoteUpdatedAt).getTime()
              const localTime = new Date(store.lastSyncAt).getTime()
              hasRemoteUpdate = remoteTime > localTime
            }

            store.updateConfig({
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

            // 只有非首次加载且有真实更新时才提示
            if (hasRemoteUpdate) {
              toast.success(`配置已同步: ${config.owner}/${config.repo} (${config.branch})`, {
                duration: 3000,
              })
            }
          } else if (!wasInitialized) {
            // 首次使用且无远程配置 → 静默自动创建
            try {
              const provisioned = await provision()
              if (provisioned) {
                store.updateConfig(provisioned)
              }
            } catch (provisionErr) {
              debugError('[ConfigDiscovery] Auto-provision failed:', provisionErr)
            }
          }

          store.setConfigInitialized()
          validateConfiguredRepo()
        } catch (err) {
          debugError('[ConfigDiscovery] Error processing config:', err)
        } finally {
          loadingRef.current = false
        }
      }).catch((err) => {
        debugError('[ConfigDiscovery] checkConfig failed:', err)
        loadingRef.current = false
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, checkConfig])

  // 自动同步配置到 GitHub
  useEffect(() => {
    if (status !== 'authenticated' || !session?.accessToken) return

    const handleConfigUpdate = async (e: Event) => {
      const detail = (e as CustomEvent).detail
      const store = configStoreRef.current
      debugLog('[AutoSync] Event received:', !!detail, 'autoSync:', store.autoSync)
      if (!detail) return

      if (store.autoSync === false) return

      if (syncingRef.current) {
        debugLog('[AutoSync] Already syncing, skipping')
        return
      }
      syncingRef.current = true

      try {
        const { owner, repo, branch } = store
        if (!owner || !repo || !branch) return

        debugLog('[AutoSync] Saving config to GitHub...')
        const result = await saveMutateAsync()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  return null
}
