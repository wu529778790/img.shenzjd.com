'use client'

import { useEffect, useRef } from 'react'
import { useConfigStore } from '@/stores/configStore'
import { useConfigCheck } from '@/hooks/useConfigCheck'
import { useSaveConfigToGitHub, checkGitHubConfigExists, CONFIG_BRANCH } from '@/hooks/useConfigSync'
import { useWxAuthSession, tryGetCredential } from '@/hooks/useWxAuthSession'
import { toast } from 'sonner'
import { debugLog, debugError, debugWarn } from '@/lib/debug'

/**
 * 配置发现组件
 *
 * wx-auth 模式下：
 * 1. 登录后（wx-auth 下发 owner/repo）自动加载远程配置（只请求 .img.shenzjd.com/config.json 一个文件）
 * 2. 对比 GitHub 和本地的时间戳，哪个新用哪个（owner/repo 以 wx-auth 下发为准，不被远程覆盖）
 * 3. 仓库由 wx-auth 的 figurebed 能力创建与管理，本组件不再负责建仓/验证仓库
 * 4. 配置变更时（config-updated 事件）自动同步回 GitHub
 */
export function ConfigDiscovery() {
  const { session } = useWxAuthSession()
  const configStore = useConfigStore()
  const { checkConfig } = useConfigCheck()
  const { mutateAsync: saveMutateAsync } = useSaveConfigToGitHub()
  const loggedIn = !!session?.loggedIn

  const syncingRef = useRef(false)
  const loadingRef = useRef(false)
  const checkedLoginRef = useRef(false)

  // ✅ 用 ref 持有最新的 configStore，避免将其放入依赖数组导致 effect 反复触发
  const configStoreRef = useRef(configStore)
  useEffect(() => {
    configStoreRef.current = configStore
  })

  // 已登录时加载配置（session 对象在每次校验后更新，未就绪时会自然重试）
  useEffect(() => {
    if (!loggedIn || checkedLoginRef.current) return
    if (loadingRef.current) return
    loadingRef.current = true

    ;(async () => {
      try {
        const cred = await tryGetCredential()
        if (!cred) {
          debugLog('[ConfigDiscovery] wx-auth not ready, retry on next session update')
          return
        }
        checkedLoginRef.current = true

        const config = await checkConfig(cred.token, true)
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

          // owner/repo 以 wx-auth 下发为准，只应用偏好类配置（branch 属于用户偏好，随配置同步往返）
          store.updateConfig({
            directory: config.directory || '',
            branch: config.branch || store.branch || 'main',
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
            configPath: config.configPath || '.img.shenzjd.com/config.json',
            autoSync: config.autoSync ?? true,
            lastSyncAt: config.lastSyncAt,
            sha: config.sha,
          })

          // 只有非首次加载且有真实更新时才提示
          if (hasRemoteUpdate) {
            toast.success('配置已从云端同步', {
              duration: 3000,
            })
          }
        } else {
          // 远端无配置文件（首次使用）→ 自动生成默认配置，登录即可用，无需手动保存
          const configPath = store.configPath || '.img.shenzjd.com/config.json'
          const exists = await checkGitHubConfigExists(cred.owner, cred.repo, CONFIG_BRANCH, configPath, cred.token)
          if (!exists) {
            debugLog('[ConfigDiscovery] 远程配置不存在，自动生成默认配置')
            const result = await saveMutateAsync()
            if (result.success) {
              debugLog('[ConfigDiscovery] 默认配置已生成:', configPath)
              if (!wasInitialized) {
                toast.success('图床已初始化完成，可以直接上传了', { duration: 3000 })
              }
            } else {
              debugWarn('[ConfigDiscovery] 默认配置生成失败:', result.message)
            }
          }
        }

        store.setConfigInitialized()
      } catch (err) {
        debugError('[ConfigDiscovery] Error processing config:', err)
      } finally {
        loadingRef.current = false
      }
    })()
  }, [loggedIn, session, checkConfig, saveMutateAsync])

  // 自动同步配置到 GitHub
  useEffect(() => {
    if (!loggedIn) return

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
  }, [loggedIn])

  return null
}
