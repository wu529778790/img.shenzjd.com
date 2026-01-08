<template>
  <div class="max-w-7xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        文件管理
      </h1>

      <!-- Warning -->
      <div v-if="!configStore.config?.repository" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ 请先配置仓库信息
        </p>
      </div>

      <!-- Controls -->
      <div class="mb-6 space-y-4">
        <div class="flex flex-wrap gap-3">
          <button
            @click="loadFiles"
            :disabled="loading || !configStore.config?.repository"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="loading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ loading ? '加载中...' : '加载文件' }}</span>
          </button>

          <button
            @click="selectAll"
            :disabled="files.length === 0"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            全选
          </button>

          <button
            @click="deselectAll"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消全选
          </button>

          <button
            @click="deleteSelected"
            :disabled="selectedFiles.size === 0 || deleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ deleting ? '删除中...' : '删除选中' }} ({{ selectedFiles.size }})</span>
          </button>

          <button
            @click="downloadSelected"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下载选中
          </button>

          <button
            @click="copySelectedUrls"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            复制选中链接
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="flex flex-wrap gap-3">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索文件名或路径..."
            class="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          <select
            v-model="filterType"
            class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">全部</option>
            <option value="image">图片</option>
            <option value="other">其他</option>
          </select>

          <select
            v-model="sortBy"
            class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="name">按名称</option>
            <option value="date">按日期</option>
            <option value="size">按大小</option>
          </select>
        </div>
      </div>

      <!-- File List -->
      <div v-if="files.length > 0" class="space-y-3">
        <div
          v-for="file in filteredFiles"
          :key="file.path"
          class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-primary-400 transition-colors"
        >
          <div class="flex items-start gap-4">
            <!-- Checkbox -->
            <div class="flex-shrink-0 pt-1">
              <input
                type="checkbox"
                :checked="selectedFiles.has(file.path)"
                @change="toggleSelection(file.path)"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <!-- Preview -->
            <div class="flex-shrink-0">
              <img
                v-if="isImage(file)"
                :src="file.download_url"
                :alt="file.name"
                class="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                @click="previewFile(file)"
                loading="lazy"
              />
              <div
                v-else
                class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer"
                @click="previewFile(file)"
              >
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ file.name }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    <span v-if="file.size">{{ formatFileSize(file.size) }} • </span>
                    <span v-if="file.type">{{ file.type }} • </span>
                    <span>{{ formatDate(file.download_url) }}</span>
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-500 mt-1 break-all">
                    {{ file.path }}
                  </p>
                  <p class="text-xs text-blue-600 dark:text-blue-400 mt-1 break-all cursor-pointer hover:underline" @click="copyToClipboard(file.download_url)">
                    {{ file.download_url }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-2 flex-shrink-0">
                  <button
                    @click="copyUrl(file)"
                    class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    复制链接
                  </button>

                  <button
                    @click="previewFile(file)"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    预览
                  </button>

                  <button
                    @click="renameFile(file)"
                    class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    重命名
                  </button>

                  <button
                    @click="deleteFile(file)"
                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else-if="!loading && configStore.config?.repository" class="text-center py-12">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">暂无文件，请先加载</p>
      </div>

      <!-- Preview Modal -->
      <div v-if="previewItem" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" @click="previewItem = null">
        <div class="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden" @click.stop>
          <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 class="font-bold text-gray-900 dark:text-white">{{ previewItem.name }}</h3>
            <button @click="previewItem = null" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-900/30">
            <img
              v-if="isImage(previewItem)"
              :src="previewItem.download_url"
              :alt="previewItem.name"
              class="max-h-[70vh] w-auto mx-auto rounded"
            />
            <div v-else class="text-center py-8">
              <p class="text-gray-600 dark:text-gray-400">预览不可用</p>
              <a :href="previewItem.download_url" target="_blank" class="text-primary-600 hover:underline mt-2 inline-block">
                在新标签页打开
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Rename Modal -->
      <div v-if="renameItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            重命名文件
          </h3>
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                当前名称
              </label>
              <input
                :value="renameItem.name"
                disabled
                class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white opacity-60"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                新名称
              </label>
              <input
                v-model="newName"
                type="text"
                placeholder="输入新文件名"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="renameItem = null"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmRename"
              :disabled="!newName || renaming"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ renaming ? '重命名中...' : '确认重命名' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="deleteConfirmItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            确认删除
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            此操作将永久删除文件，且无法恢复
          </p>
          <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-4">
            <p class="text-sm text-red-800 dark:text-red-200 font-mono break-all">
              {{ deleteConfirmItem.path }}
            </p>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="deleteConfirmItem = null"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              @click="confirmDelete"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              确认删除
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useConfigStore } from '~/stores/config'
import { useToastStore } from '~/stores/toast'

interface FileItem {
  name: string
  path: string
  type: string
  size: number
  download_url: string
  sha: string
}

const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()

const files = ref<FileItem[]>([])
const loading = ref(false)
const deleting = ref(false)
const renaming = ref(false)
const selectedFiles = ref<Set<string>>(new Set())

const searchQuery = ref('')
const filterType = ref<'all' | 'image' | 'other'>('all')
const sortBy = ref<'name' | 'date' | 'size'>('name')

const previewItem = ref<FileItem | null>(null)
const renameItem = ref<FileItem | null>(null)
const newName = ref('')
const deleteConfirmItem = ref<FileItem | null>(null)

// 过滤和排序文件
const filteredFiles = computed(() => {
  let result = [...files.value]

  // 搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(f => f.name.toLowerCase().includes(query) || f.path.toLowerCase().includes(query))
  }

  // 过滤类型
  if (filterType.value === 'image') {
    result = result.filter(f => isImage(f))
  } else if (filterType.value === 'other') {
    result = result.filter(f => !isImage(f))
  }

  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'date':
        // 从 URL 中提取时间戳（如果有）
        return b.download_url.localeCompare(a.download_url)
      case 'size':
        return (b.size || 0) - (a.size || 0)
      default:
        return 0
    }
  })

  return result
})

// 加载文件列表
const loadFiles = async () => {
  if (!configStore.config?.repository) {
    toastStore.error('请先配置仓库信息')
    return
  }

  loading.value = true
  files.value = []
  selectedFiles.value.clear()

  try {
    const response = await $fetch('/api/management/list', {
      query: {
        owner: configStore.config.repositoryOwner,
        name: configStore.config.repositoryName,
        path: configStore.config.directory || '',
        ref: configStore.config.branch || 'main'
      },
      headers: useRequestHeaders(['cookie'])
    })

    files.value = response
    toastStore.success(`成功加载 ${response.length} 个文件`)
  } catch (error: any) {
    toastStore.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

// 选择/取消选择
const toggleSelection = (path: string) => {
  if (selectedFiles.value.has(path)) {
    selectedFiles.value.delete(path)
  } else {
    selectedFiles.value.add(path)
  }
}

const selectAll = () => {
  filteredFiles.value.forEach(f => selectedFiles.value.add(f.path))
}

const deselectAll = () => {
  selectedFiles.value.clear()
}

// 删除单个文件
const deleteFile = (file: FileItem) => {
  deleteConfirmItem.value = file
}

const confirmDelete = async () => {
  if (!deleteConfirmItem.value) return

  try {
    await $fetch('/api/management/delete', {
      method: 'DELETE',
      body: {
        paths: [deleteConfirmItem.value.path],
        message: `Delete: ${deleteConfirmItem.value.name}`,
        repository: {
          owner: configStore.config.repositoryOwner,
          name: configStore.config.repositoryName,
          branch: configStore.config.branch
        },
        shas: [deleteConfirmItem.value.sha]
      },
      headers: useRequestHeaders(['cookie'])
    })

    files.value = files.value.filter(f => f.path !== deleteConfirmItem.value?.path)
    selectedFiles.value.delete(deleteConfirmItem.value.path)
    toastStore.success('删除成功')
  } catch (error: any) {
    toastStore.error(error.message || '删除失败')
  } finally {
    deleteConfirmItem.value = null
  }
}

// 删除选中文件
const deleteSelected = async () => {
  if (selectedFiles.value.size === 0) return

  if (!confirm(`确定要删除选中的 ${selectedFiles.value.size} 个文件吗？`)) {
    return
  }

  deleting.value = true

  const pathsToDelete = Array.from(selectedFiles.value)
  const filesToDelete = files.value.filter(f => pathsToDelete.includes(f.path))

  try {
    await $fetch('/api/management/delete', {
      method: 'DELETE',
      body: {
        paths: pathsToDelete,
        message: `Delete ${pathsToDelete.length} files`,
        repository: {
          owner: configStore.config.repositoryOwner,
          name: configStore.config.repositoryName,
          branch: configStore.config.branch
        },
        shas: filesToDelete.map(f => f.sha)
      },
      headers: useRequestHeaders(['cookie'])
    })

    files.value = files.value.filter(f => !pathsToDelete.includes(f.path))
    selectedFiles.value.clear()
    toastStore.success('删除成功')
  } catch (error: any) {
    toastStore.error(error.message || '删除失败')
  } finally {
    deleting.value = false
  }
}

// 重命名文件
const renameFile = (file: FileItem) => {
  renameItem.value = file
  newName.value = file.name
}

const confirmRename = async () => {
  if (!renameItem.value || !newName.value) return

  if (newName.value === renameItem.value.name) {
    renameItem.value = null
    return
  }

  renaming.value = true

  const oldPath = renameItem.value.path
  const oldName = renameItem.value.name
  const directory = oldPath.substring(0, oldPath.length - oldName.length)
  const newPath = directory + newName.value

  try {
    await $fetch('/api/management/rename', {
      method: 'PATCH',
      body: {
        oldPath,
        newPath,
        repository: {
          owner: configStore.config.repositoryOwner,
          name: configStore.config.repositoryName,
          branch: configStore.config.branch
        }
      },
      headers: useRequestHeaders(['cookie'])
    })

    // 更新本地列表
    const index = files.value.findIndex(f => f.path === oldPath)
    if (index !== -1) {
      files.value[index].name = newName.value
      files.value[index].path = newPath
    }

    // 更新选中状态
    if (selectedFiles.value.has(oldPath)) {
      selectedFiles.value.delete(oldPath)
      selectedFiles.value.add(newPath)
    }

    toastStore.success('重命名成功')
    renameItem.value = null
    newName.value = ''
  } catch (error: any) {
    toastStore.error(error.message || '重命名失败')
  } finally {
    renaming.value = false
  }
}

// 复制 URL
const copyUrl = async (file: FileItem) => {
  await copyToClipboard(file.download_url)
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toastStore.success('复制成功')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// 复制选中文件的 URL
const copySelectedUrls = async () => {
  if (selectedFiles.value.size === 0) return

  const selected = files.value.filter(f => selectedFiles.value.has(f.path))
  const text = selected.map(f => `${f.name}: ${f.download_url}`).join('\n')

  await copyToClipboard(text)
}

// 预览文件
const previewFile = (file: FileItem) => {
  previewItem.value = file
}

// 下载选中文件
const downloadSelected = () => {
  if (selectedFiles.value.size === 0) return

  const selected = files.value.filter(f => selectedFiles.value.has(f.path))
  selected.forEach(f => {
    const a = document.createElement('a')
    a.href = f.download_url
    a.download = f.name
    a.target = '_blank'
    a.click()
  })

  toastStore.success('下载已开始')
}

// 判断是否为图片
const isImage = (file: FileItem): boolean => {
  return file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(file.name)
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化日期（从 URL 或文件名估算）
const formatDate = (url: string): string => {
  // 尝试从 URL 中提取时间信息
  const dateMatch = url.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (dateMatch) {
    return dateMatch[0]
  }
  return new Date().toLocaleDateString()
}

// 初始化
onMounted(async () => {
  if (authStore.isAuthenticated && configStore.config?.repository) {
    await loadFiles()
  }
})
</script>
