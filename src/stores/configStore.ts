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
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...defaultConfig,
      updateConfig: (updates, onUpdate) => {
        set((state) => ({ ...state, ...updates }))
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
