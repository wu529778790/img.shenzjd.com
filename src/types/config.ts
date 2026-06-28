export interface Config {
  owner: string
  repo: string
  branch: string
  directory: string
  compressionEnabled: boolean
  compressionQuality: number
  watermarkEnabled: boolean
  watermarkText: string
  watermarkColor: string
  watermarkSize: number
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  theme: 'light' | 'dark' | 'system'
  cdn: 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages'
  useRaw: boolean
  // 配置同步
  configPath?: string          // GitHub 上的配置路径，如 '.imgx-config/config.json'
  autoSync?: boolean           // 是否自动同步配置到 GitHub
  lastSyncAt?: string          // 上次同步时间
}
