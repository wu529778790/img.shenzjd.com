import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config } from '@/types/config'

interface ConfigState extends Config {
  updateConfig: (updates: Partial<Config>) => void
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
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      ...defaultConfig,
      updateConfig: (updates) => {
        set((state) => ({ ...state, ...updates }))
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
