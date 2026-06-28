export interface ImageFile {
  id: string
  name: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  download_url: string
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
  format: 'markdown' | 'html' | 'bbcode'
  cdn: 'github' | 'jsdelivr' | 'jsdmirror' | 'github-pages'
  owner: string
  repo: string
  branch: string
  path: string
  fileName: string
  useRaw?: boolean
}
