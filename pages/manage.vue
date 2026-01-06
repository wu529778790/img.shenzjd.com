<template>
  <div class="max-w-7xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {{ $t('manage.title') }}
      </h1>

      <!-- Warning -->
      <div v-if="!configStore.config?.repository" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ {{ $t('manage.noConfigWarning') }}
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
            <span>{{ loading ? $t('manage.loading') : $t('manage.loadFiles') }}</span>
          </button>

          <button
            @click="selectAll"
            :disabled="files.length === 0"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('manage.selectAll') }}
          </button>

          <button
            @click="deselectAll"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('manage.deselectAll') }}
          </button>

          <button
            @click="deleteSelected"
            :disabled="selectedFiles.size === 0 || deleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="deleting" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ deleting ? $t('manage.deleting') : $t('manage.deleteSelected') }} ({{ selectedFiles.size }})</span>
          </button>

          <button
            @click="downloadSelected"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('manage.downloadSelected') }}
          </button>

          <button
            @click="copySelectedUrls"
            :disabled="selectedFiles.size === 0"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ $t('manage.copySelectedUrls') }}
          </button>
        </div>

        <!-- Search and Filter -->
        <div class="flex flex-wrap gap-3">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('manage.searchPlaceholder')"
            class="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />

          <select
            v-model="filterType"
            class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">{{ $t('manage.filterAll') }}</option>
            <option value="image">{{ $t('manage.filterImages') }}</option>
            <option value="other">{{ $t('manage.filterOther') }}</option>
          </select>

          <select
            v-model="sortBy"
            class="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="name">{{ $t('manage.sortName') }}</option>
            <option value="date">{{ $t('manage.sortDate') }}</option>
            <option value="size">{{ $t('manage.sortSize') }}</option>
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
                    {{ $t('manage.copy') }}
                  </button>

                  <button
                    @click="previewFile(file)"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    {{ $t('manage.preview') }}
                  </button>

                  <button
                    @click="renameFile(file)"
                    class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    {{ $t('manage.rename') }}
                  </button>

                  <button
                    @click="deleteFile(file)"
                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    {{ $t('manage.delete') }}
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
        <p class="text-gray-500 dark:text-gray-400">{{ $t('manage.noFiles') }}</p>
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
              <p class="text-gray-600 dark:text-gray-400">{{ $t('manage.previewNotAvailable') }}</p>
              <a :href="previewItem.download_url" target="_blank" class="text-primary-600 hover:underline mt-2 inline-block">
                {{ $t('manage.openInNewTab') }}
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Rename Modal -->
      <div v-if="renameItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {{ $t('manage.renameFile') }}
          </h3>
          <div class="space-y-3 mb-4">
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('manage.currentName') }}
              </label>
              <input
                :value="renameItem.name"
                disabled
                class="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white opacity-60"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                {{ $t('manage.newName') }}
              </label>
              <input
                v-model="newName"
                type="text"
                :placeholder="$t('manage.newNamePlaceholder')"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="renameItem = null"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              {{ $t('manage.cancel') }}
            </button>
            <button
              @click="confirmRename"
              :disabled="!newName || renaming"
              class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ renaming ? $t('manage.renaming') : $t('manage.confirmRename') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirmation Modal -->
      <div v-if="deleteConfirmItem" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            {{ $t('manage.confirmDelete') }}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-4">
            {{ $t('manage.deleteWarning') }}
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
              {{ $t('manage.cancel') }}
            </button>
            <button
              @click="confirmDelete"
              class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              {{ $t('manage.confirmDelete') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
    toastStore.error($t('manage.noConfigWarning'))
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
    toastStore.success($t('manage.loadSuccess', { count: response.length }))
  } catch (error: any) {
    toastStore.error(error.message || $t('manage.loadFailed'))
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
    toastStore.success($t('manage.deleteSuccess'))
  } catch (error: any) {
    toastStore.error(error.message || $t('manage.deleteFailed'))
  } finally {
    deleteConfirmItem.value = null
  }
}

// 删除选中文件
const deleteSelected = async () => {
  if (selectedFiles.value.size === 0) return

  if (!confirm($t('manage.deleteSelectedConfirm', { count: selectedFiles.value.size }))) {
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
    toastStore.success($t('manage.deleteSuccess'))
  } catch (error: any) {
    toastStore.error(error.message || $t('manage.deleteFailed'))
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

    toastStore.success($t('manage.renameSuccess'))
    renameItem.value = null
    newName.value = ''
  } catch (error: any) {
    toastStore.error(error.message || $t('manage.renameFailed'))
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
    toastStore.success($t('manage.copySuccess'))
  } catch (error) {
    toastStore.error($t('manage.copyFailed'))
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

  toastStore.success($t('manage.downloadStarted'))
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
