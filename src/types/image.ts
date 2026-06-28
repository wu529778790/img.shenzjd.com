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
  type: 'file' | 'dir'
  created_at?: string
  uploaded_at?: Date
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

export interface OperationLog {
  id: string
  type: 'upload' | 'delete' | 'copy' | 'settings'
  action: string
  status: 'success' | 'error' | 'pending'
  timestamp: Date
  detail?: string
}
