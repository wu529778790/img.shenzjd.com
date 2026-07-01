import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config } from '@/types/config'

const pendingTimers = new Set<ReturnType<typeof setTimeout>>()

export interface ConfigState extends Config {
  configLastCheckedAt?: number
  configCheckedRepo?: string
  configCheckedBranch?: string
  /** 是否已完成首次配置加载（用于区分"首次加载"和"后续同步"） */
  configInitialized: boolean

  updateConfig: (updates: Partial<Config>, onUpdate?: () => void) => void
  resetConfig: () => void

  markConfigChecked: (repo: string, branch: string) => void
  needsConfigCheck: (ttl?: number) => boolean
  invalidateConfigCheck: () => void
  setConfigInitialized: () => void
}

const defaultConfig: Config = {
  owner: '',
  repo: '',
  branch: 'main',
  directory: '',
  compressionEnabled: false,
  compressionQuality: 80,
  watermarkEnabled: false,
  watermarkText: 'by img.shenzjd.com',
  watermarkColor: '#ffffff',
  watermarkSize: 24,
  watermarkPosition: 'bottom-right',
  theme: 'system',
  cdn: 'jsdmirror',
  useRaw: true,
  copyFormat: 'url',
  autoCopyAfterUpload: true,
  useOriginalFileName: false,
  convertToWebp: true,
  configPath: '.imgx-config/config.json',
  autoSync: true,
}

function migrateConfig(persistedState: unknown): ConfigState {
  if (persistedState && typeof persistedState === 'object' && 'state' in persistedState) {
    const v4State = (persistedState as { state: ConfigState }).state
    return { ...defaultConfig, ...v4State, configInitialized: v4State.configInitialized ?? false } as ConfigState
  }
  return { ...defaultConfig, ...(persistedState as Partial<Config>), configInitialized: false } as ConfigState
}

export const useConfigStore = create<ConfigState>()(
  persist(
    () => ({
      ...defaultConfig,
      configInitialized: false as boolean,

      updateConfig: (updates, onUpdate) => {
        useConfigStore.setState((state) => {
          const newState = { ...state, ...updates }

          const syncKeys: (keyof Config)[] = [
            'owner', 'repo', 'branch', 'directory',
            'compressionEnabled', 'compressionQuality',
            'watermarkEnabled', 'watermarkText', 'watermarkColor',
            'watermarkSize', 'watermarkPosition',
            'theme', 'cdn', 'useRaw', 'copyFormat',
            'autoCopyAfterUpload', 'useOriginalFileName',
            'convertToWebp',
            'configPath', 'autoSync',
          ]
          const hasUserConfigChange = syncKeys.some((key) => key in updates)
          if (hasUserConfigChange) {
            const timer = setTimeout(() => {
              pendingTimers.delete(timer)
              const currentAutoSync = useConfigStore.getState().autoSync
              if (currentAutoSync !== false && typeof window !== 'undefined') {
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
        pendingTimers.forEach((timer) => clearTimeout(timer))
        pendingTimers.clear()
        useConfigStore.setState({ ...defaultConfig, configInitialized: false })
      },

      markConfigChecked: (repo: string, branch: string) => {
        useConfigStore.setState({
          configLastCheckedAt: Date.now(),
          configCheckedRepo: repo,
          configCheckedBranch: branch,
        })
      },

      needsConfigCheck: (ttl: number = 5 * 60 * 1000): boolean => {
        const state = useConfigStore.getState()
        if (!state.configLastCheckedAt) return true
        return Date.now() - state.configLastCheckedAt > ttl
      },

      invalidateConfigCheck: () => {
        useConfigStore.setState({
          configLastCheckedAt: undefined,
          configCheckedRepo: undefined,
          configCheckedBranch: undefined,
        })
      },

      setConfigInitialized: () => {
        useConfigStore.setState({ configInitialized: true })
      },
    }),
    {
      name: 'config-storage',
      version: 1,
      migrate: migrateConfig,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[ConfigStore] Rehydration failed, resetting:', error)
          useConfigStore.setState(defaultConfig)
        } else {
          console.log('[ConfigStore] Rehydrated successfully')
        }
      },
    }
  )
)
