import { defineStore } from 'pinia'
import { apiFetch } from '~/utils/api-fetch'

export interface FileItem {
  name: string
  path: string
  size: number
  downloadUrl: string
  sha: string
  selected?: boolean
}

export interface DirectoryItem {
  name: string
  path: string
}

export interface ManagementState {
  files: FileItem[]
  directories: DirectoryItem[]
  currentPath: string
  loading: boolean
  selectedFiles: Set<string>
  searchQuery: string
}

export const useManagementStore = defineStore('management', {
  state: (): ManagementState => ({
    files: [],
    directories: [],
    currentPath: '',
    loading: false,
    selectedFiles: new Set(),
    searchQuery: ''
  }),

  getters: {
    getFiles: (state) => state.files,
    getDirectories: (state) => state.directories,
    getCurrentPath: (state) => state.currentPath,
    getSelectedFiles: (state) => state.selectedFiles,
    getFilteredFiles: (state) => {
      if (!state.searchQuery) return state.files
      return state.files.filter(f =>
        f.name.toLowerCase().includes(state.searchQuery.toLowerCase())
      )
    },
    getSelectedCount: (state) => state.selectedFiles.size
  },

  actions: {
    /**
     * 加载文件列表
     */
    async loadFileList(path: string = '') {
      const configStore = useConfigStore()
      const authStore = useAuthStore()

      if (!configStore.config || !authStore.user) return

      this.loading = true
      this.currentPath = path

      try {
        const response = await apiFetch('/api/management/list', {
          query: {
            owner: configStore.config.storage.repository.owner,
            repo: configStore.config.storage.repository.name,
            path: path,
            ref: configStore.config.storage.repository.branch
          }
        })

        this.files = response.data.files || []
        this.directories = response.data.directories || []
        this.selectedFiles.clear()
      } catch (error) {
        console.error('Load file list error:', error)
        this.files = []
        this.directories = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 刷新当前目录
     */
    async refresh() {
      await this.loadFileList(this.currentPath)
    },

    /**
     * 进入目录
     */
    async enterDirectory(path: string) {
      const newPath = this.currentPath ? `${this.currentPath}/${path}` : path
      await this.loadFileList(newPath)
    },

    /**
     * 返回上一级
     */
    async goBack() {
      if (!this.currentPath) return

      const parts = this.currentPath.split('/')
      parts.pop()
      const newPath = parts.join('/')
      await this.loadFileList(newPath)
    },

    /**
     * 选择/取消选择文件
     */
    toggleFileSelection(path: string) {
      if (this.selectedFiles.has(path)) {
        this.selectedFiles.delete(path)
      } else {
        this.selectedFiles.add(path)
      }
    },

    /**
     * 全选/取消全选
     */
    toggleSelectAll() {
      if (this.selectedFiles.size === this.files.length) {
        this.selectedFiles.clear()
      } else {
        this.files.forEach(f => this.selectedFiles.add(f.path))
      }
    },

    /**
     * 设置搜索查询
     */
    setSearchQuery(query: string) {
      this.searchQuery = query
    },

    /**
     * 删除单个文件
     */
    async deleteFile(file: FileItem) {
      const configStore = useConfigStore()
      const toastStore = useToastStore()

      if (!configStore.config) return false

      try {
        await apiFetch('/api/management/delete', {
          method: 'DELETE',
          body: {
            path: file.path,
            repository: configStore.config.storage.repository
          }
        })

        toastStore.success(`${file.name} 已删除`)
        await this.refresh()
        return true
      } catch (error: any) {
        toastStore.error(`删除失败: ${error.message || '未知错误'}`)
        return false
      }
    },

    /**
     * 批量删除
     */
    async deleteSelected() {
      const filesToDelete = this.files.filter(f => this.selectedFiles.has(f.path))

      if (filesToDelete.length === 0) return

      const { $utils } = useNuxtApp()
      const toastStore = useToastStore()

      if (!confirm(`确定要删除选中的 ${filesToDelete.length} 个文件吗？`)) {
        return
      }

      let successCount = 0
      let failCount = 0

      for (const file of filesToDelete) {
        const success = await this.deleteFile(file)
        if (success) successCount++
        else failCount++
      }

      if (failCount === 0) {
        toastStore.success(`成功删除 ${successCount} 个文件`)
      } else {
        toastStore.warning(`删除完成：${successCount} 成功，${failCount} 失败`)
      }

      this.selectedFiles.clear()
    },

    /**
     * 复制单个文件链接
     */
    async copyFileLink(file: FileItem, format: 'raw' | 'github' | 'cdn' = 'cdn') {
      const configStore = useConfigStore()
      const toastStore = useToastStore()

      if (!configStore.config) return

      const { owner, name, branch } = configStore.config.storage.repository
      let link = ''

      switch (format) {
        case 'raw':
          link = `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${file.path}`
          break
        case 'github':
          link = `https://github.com/${owner}/${name}/blob/${branch}/${file.path}`
          break
        case 'cdn':
          link = `https://cdn.jsdelivr.net/gh/${owner}/${name}@${branch}/${file.path}`
          break
      }

      try {
        await navigator.clipboard.writeText(link)
        toastStore.success('链接已复制')
      } catch (error) {
        toastStore.error('复制失败')
      }
    },

    /**
     * 批量复制链接
     */
    async copySelectedLinks(format: 'raw' | 'github' | 'cdn' = 'cdn') {
      const files = this.files.filter(f => this.selectedFiles.has(f.path))
      if (files.length === 0) return

      const configStore = useConfigStore()
      const toastStore = useToastStore()

      if (!configStore.config) return

      const { owner, name, branch } = configStore.config.storage.repository
      const links = files.map(f => {
        switch (format) {
          case 'raw':
            return `https://raw.githubusercontent.com/${owner}/${name}/${branch}/${f.path}`
          case 'github':
            return `https://github.com/${owner}/${name}/blob/${branch}/${f.path}`
          case 'cdn':
            return `https://cdn.jsdelivr.net/gh/${owner}/${name}@${branch}/${f.path}`
          default:
            return ''
        }
      }).join('\n')

      try {
        await navigator.clipboard.writeText(links)
        toastStore.success(`已复制 ${files.length} 个链接`)
      } catch (error) {
        toastStore.error('复制失败')
      }
    },

    /**
     * 重命名文件
     */
    async renameFile(file: FileItem, newName: string) {
      const configStore = useConfigStore()
      const toastStore = useToastStore()

      if (!configStore.config) return false

      const oldPath = file.path
      const directory = oldPath.substring(0, oldPath.lastIndexOf('/'))
      const newPath = directory ? `${directory}/${newName}` : newName

      try {
        await apiFetch('/api/management/rename', {
          method: 'PATCH',
          body: {
            oldPath,
            newPath,
            repository: configStore.config.storage.repository
          }
        })

        toastStore.success('文件已重命名')
        await this.refresh()
        return true
      } catch (error: any) {
        toastStore.error(`重命名失败: ${error.message || '未知错误'}`)
        return false
      }
    }
  }
})
