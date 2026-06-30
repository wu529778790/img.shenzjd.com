import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config } from '@/types/config'

// 存储待清理的 timer，防止内存泄漏
const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

export interface ConfigState extends Config {
  // 配置检测缓存
  configLastCheckedAt?: number  // 最后检测时间戳
  configCheckedRepo?: string    // 上次检测的仓库
  configCheckedBranch?: string  // 上次检测的分支

  updateConfig: (updates: Partial<Config>, onUpdate?: () => void) => void
  resetConfig: () => void

  // 配置检测相关方法
  markConfigChecked: (repo: string, branch: string) => void
  needsConfigCheck: (ttl?: number) => boolean
  invalidateConfigCheck: () => void
}

const defaultConfig: Config = {
  owner: '',
  repo: '',
  branch: 'main',
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
  // 上传时使用原始文件名（关闭则用时间戳重命名）
  useOriginalFileName: false,
  configPath: '.imgx-config/config.json',
  autoSync: true,
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      ...defaultConfig,
      updateConfig: (updates, onUpdate) => {
        set((state) => {
          const newState = { ...state, ...updates }
          // 只有用户-facing配置变更才触发自动同步事件
          // 内部元数据（lastSyncAt/sha/configLastCheckedAt等）不触发，避免循环
          const syncKeys: (keyof Config)[] = [
            'owner', 'repo', 'branch', 'directory',
            'compressionEnabled', 'compressionQuality',
            'watermarkEnabled', 'watermarkText', 'watermarkColor',
            'watermarkSize', 'watermarkPosition',
            'theme', 'cdn', 'useRaw', 'copyFormat',
            'autoCopyAfterUpload', 'useOriginalFileName',
            'configPath', 'autoSync',
          ]
          const hasUserConfigChange = syncKeys.some((key) => key in updates)
          if (hasUserConfigChange) {
            // 延迟同步，避免阻塞 UI
            const timer = setTimeout(() => {
              pendingTimers.delete(timer)
              console.log('[ConfigStore] config-updated event:', updates)
              const autoSync = get().autoSync
              if (autoSync !== false && typeof window !== 'undefined') {
                // 触发自定义事件，让组件可以监听并同步
                window.dispatchEvent(new CustomEvent('config-updated', { detail: updates }))
              }
            }, 0)
            pendingTimers.add(timer)
          }
          return newState
        })
        if (onUpdate) onUpdate()
      },
      resetConfig: () => {
        // ✅ 清理所有待执行的 config-updated 定时器
        pendingTimers.forEach((timer) => clearTimeout(timer))
        pendingTimers.clear()
        set(defaultConfig)
      },
      markConfigChecked: (repo: string, branch: string) => {
        set({
          configLastCheckedAt: Date.now(),
          configCheckedRepo: repo,
          configCheckedBranch: branch,
        })
      },
      needsConfigCheck: (ttl: number = 5 * 60 * 1000) => {
        const state = get()
        // 如果没有检测过，需要检测
        if (!state.configLastCheckedAt) return true

        // 如果距离上次检测超过 TTL，需要重新检测
        const elapsed = Date.now() - state.configLastCheckedAt
        return elapsed > ttl
      },
      invalidateConfigCheck: () => {
        set({
          configLastCheckedAt: undefined,
          configCheckedRepo: undefined,
          configCheckedBranch: undefined,
        })
      },
    }),
    {
      name: 'config-storage',
    }
  )
)
