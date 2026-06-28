import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config } from '@/types/config'

export interface ConfigState extends Config {
  updateConfig: (updates: Partial<Config>, onUpdate?: () => void) => void
  resetConfig: () => void
}

const defaultConfig: Config = {
  owner: '',
  repo: '',
  branch: 'main',
  directory: '',
  compressionEnabled: true,
  compressionQuality: 80,
  watermarkEnabled: false,
  watermarkText: '',
  watermarkColor: '#ffffff',
  watermarkSize: 24,
  watermarkPosition: 'bottom-right',
  theme: 'system',
  cdn: 'github',
  useRaw: true,
  copyFormat: 'markdown',
  autoCopyAfterUpload: true,
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
          // 如果启用了自动同步，触发配置同步
          if (updates.configPath !== undefined || updates.autoSync !== false) {
            // 延迟同步，避免阻塞 UI
            setTimeout(() => {
              const autoSync = get().autoSync
              if (autoSync !== false && typeof window !== 'undefined') {
                // 触发自定义事件，让组件可以监听并同步
                window.dispatchEvent(new CustomEvent('config-updated', { detail: updates }))
              }
            }, 0)
          }
          return newState
        })
        if (onUpdate) onUpdate()
      },
      resetConfig: () => {
        set(defaultConfig)
      },
    }),
    {
      name: 'config-storage',
    }
  )
)
