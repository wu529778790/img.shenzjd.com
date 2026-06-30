export interface ImageFile {
  id: string
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
  cdnUrl?: string // CDN 加速链接，根据配置生成
  width?: number
  height?: number
  type: 'file' | 'dir'
  created_at?: string
  uploaded_at?: string
}

// GitHub API 原始文件信息（API 层，与业务层 ImageFile 解耦）
export interface GitHubFileInfo {
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
  type: 'file' | 'dir'
}

export interface UploadTask {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  result?: ImageFile
}

export interface LinkOptions {
  format: 'markdown' | 'html' | 'bbcode' | 'url'
  cdn: 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages'
  owner: string
  repo: string
  branch: string
  path: string
  fileName: string
  useRaw?: boolean
}
