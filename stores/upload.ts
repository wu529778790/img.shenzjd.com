import { defineStore } from 'pinia'

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  result?: {
    filename: string
    path: string
    sha: string
    urls: {
      raw: string
      github: string
      cdn: string
    }
  }
  error?: string
}

export interface UploadState {
  files: UploadFile[]
  uploading: boolean
  totalProgress: number
}

export const useUploadStore = defineStore('upload', {
  state: (): UploadState => ({
    files: [],
    uploading: false,
    totalProgress: 0
  }),

  getters: {
    getFiles: (state) => state.files,
    getPendingFiles: (state) => state.files.filter(f => f.status === 'pending'),
    getUploadedFiles: (state) => state.files.filter(f => f.status === 'success'),
    getTotalProgress: (state) => state.totalProgress
  },

  actions: {
    /**
     * 添加文件到上传列表
     */
    async addFiles(fileList: FileList) {
      const { $utils } = useNuxtApp()
      const toastStore = useToastStore()

      for (const file of Array.from(fileList)) {
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          toastStore.warning(`${file.name} 不是有效的图片文件`)
          continue
        }

        // 检查文件大小（10MB 限制）
        if (file.size > 10 * 1024 * 1024) {
          toastStore.warning(`${file.name} 超过 10MB 限制`)
          continue
        }

        const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const uploadFile: UploadFile = {
          id,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          progress: 0,
          status: 'pending'
        }

        this.files.push(uploadFile)
      }
    },

    /**
     * 移除文件
     */
    removeFile(id: string) {
      this.files = this.files.filter(f => f.id !== id)
    },

    /**
     * 清空列表
     */
    clearFiles() {
      this.files = []
      this.totalProgress = 0
    },

    /**
     * 上传单个文件
     */
    async uploadFile(file: UploadFile) {
      const { $fetch } = useNuxtApp()
      const configStore = useConfigStore()
      const toastStore = useToastStore()

      if (!configStore.config) {
        file.status = 'error'
        file.error = '配置不存在'
        return
      }

      file.status = 'uploading'
      file.progress = 0

      try {
        // 读取文件为 Base64
        const base64 = await this.fileToBase64(file.file)

        // 上传到服务器
        const response = await $fetch('/api/upload/image', {
          method: 'PUT',
          body: {
            content: base64,
            filename: file.name,
            repository: configStore.config.storage.repository,
            directory: configStore.config.storage.directory.path,
            naming: configStore.config.storage.naming,
            timestamp: Date.now()
          },
          onRequest: ({ options }) => {
            // 模拟进度
            let progress = 0
            const interval = setInterval(() => {
              progress += 10
              if (progress < 90) {
                file.progress = progress
              }
            }, 100)
            options.onResponse = () => {
              clearInterval(interval)
              file.progress = 100
            }
          }
        })

        file.result = response.data
        file.status = 'success'
        toastStore.success(`${file.name} 上传成功`)
      } catch (error: any) {
        file.status = 'error'
        file.error = error.message || '上传失败'
        toastStore.error(`${file.name} 上传失败`)
      }

      this.updateTotalProgress()
    },

    /**
     * 上传所有文件
     */
    async uploadAll() {
      if (this.uploading) return

      this.uploading = true
      const pendingFiles = this.getPendingFiles

      for (const file of pendingFiles) {
        await this.uploadFile(file)
      }

      this.uploading = false
      this.updateTotalProgress()
    },

    /**
     * 复制链接
     */
    async copyLink(file: UploadFile, format: 'raw' | 'github' | 'cdn' = 'cdn') {
      if (!file.result) return

      const { $utils } = useNuxtApp()
      const toastStore = useToastStore()

      const link = file.result.urls[format]

      try {
        await navigator.clipboard.writeText(link)
        toastStore.success('链接已复制')
      } catch (error) {
        toastStore.error('复制失败')
      }
    },

    /**
     * 复制所有链接
     */
    async copyAllLinks(format: 'raw' | 'github' | 'cdn' = 'cdn') {
      const uploadedFiles = this.getUploadedFiles
      if (uploadedFiles.length === 0) return

      const links = uploadedFiles.map(f => f.result?.urls[format]).filter(Boolean).join('\n')

      try {
        await navigator.clipboard.writeText(links)
        const toastStore = useToastStore()
        toastStore.success(`已复制 ${uploadedFiles.length} 个链接`)
      } catch (error) {
        const toastStore = useToastStore()
        toastStore.error('复制失败')
      }
    },

    /**
     * 更新总进度
     */
    updateTotalProgress() {
      if (this.files.length === 0) {
        this.totalProgress = 0
        return
      }

      const total = this.files.length
      const completed = this.files.filter(f => f.status === 'success' || f.status === 'error').length
      this.totalProgress = Math.round((completed / total) * 100)
    },

    /**
     * 文件转 Base64
     */
    fileToBase64(file: File): Promise<string> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // 移除 data URL 前缀，只保留 Base64 部分
          const base64 = result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    },

    /**
     * 获取文件的预览 URL
     */
    getFilePreview(file: UploadFile): string {
      return URL.createObjectURL(file.file)
    },

    /**
     * 重置文件状态
     */
    resetFile(id: string) {
      const file = this.files.find(f => f.id === id)
      if (file) {
        file.status = 'pending'
        file.progress = 0
        file.result = undefined
        file.error = undefined
      }
    }
  }
})
