'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useConfigCheck } from '@/hooks/useConfigCheck'
import { toast } from 'sonner'

/**
 * 配置发现组件
 *
 * 功能：
 * 1. 登录后自动加载配置（只请求一次配置文件）
 * 2. 对比 GitHub 和本地的时间戳，哪个新用哪个
 * 3. 更新 configStore
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

  // 已登录时加载配置
  useEffect(() => {
    if (status === 'authenticated' && session?.accessToken) {
      checkConfig().then((config) => {
        if (config) {
          // 提取配置内容，排除内部字段
          const { _remoteUpdatedAt } = config

          // 检查是否有更新的远程配置
          let hasRemoteUpdate = false
          if (_remoteUpdatedAt && configStore.lastSyncAt) {
            const remoteTime = new Date(_remoteUpdatedAt)
            const localTime = new Date(configStore.lastSyncAt)
            hasRemoteUpdate = remoteTime > localTime
          }

          // 静默更新配置（不打扰用户）
          configStore.updateConfig({
            owner: config.owner,
            repo: config.repo,
            branch: config.branch,
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
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, checkConfig])  // ✅ 移除 configStore 依赖，避免死循环

  return null
}
