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
}

export type CompressionQuality = 0 | 25 | 50 | 75 | 100
