<template>
  <div class="max-w-7xl mx-auto">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
      图片上传
    </h1>

    <!-- Main Upload Card -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
      <!-- Upload Area -->
      <div
        class="border-2 border-dashed rounded-t-xl p-8 text-center transition-all duration-300 ease-in-out"
        :class="[
          isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 scale-[1.01]' 
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/80'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          拖拽图片到此处或点击选择
        </h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
          支持 JPG、PNG、GIF、WebP、SVG 格式，单文件最大 10MB
        </p>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFileSelect"
        />
        <button
          @click="fileInput?.click()"
          class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
        >
          选择图片文件
        </button>
      </div>

      <!-- Warning -->
      <div v-if="!configStore.config?.storage.repository.name" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-t border-b border-yellow-200 dark:border-yellow-800">
        <p class="text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
          ⚠️ <span>请先在配置页设置仓库信息，否则无法上传</span>
        </p>
      </div>

      <!-- File List -->
      <div v-if="selectedFiles.length > 0" class="p-6 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            待上传文件 ({{ selectedFiles.length }})
          </h3>
          <div class="flex gap-2">
            <button
              @click="uploadAll"
              :disabled="uploading || !configStore.config?.storage.repository.name"
              class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg v-if="uploading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{{ uploading ? '上传中...' : '全部上传' }}</span>
            </button>
            <button
              @click="clearAll"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
            >
              清空列表
            </button>
          </div>
        </div>

        <!-- File Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(file, index) in selectedFiles"
            :key="file.id"
            class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 transition-all duration-200 hover:shadow-md"
          >
            <!-- Preview -->
            <div class="relative mb-3 group">
              <img
                v-if="file.preview"
                :src="file.preview"
                :alt="file.file.name"
                class="w-full h-40 object-cover rounded-lg border border-gray-300 dark:border-gray-600 transition-transform duration-300 group-hover:scale-105"
              />
              <div v-else class="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <button
                @click="removeFile(index)"
                class="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                :title="'移除 ' + file.file.name"
              >
                ✕
              </button>
            </div>

            <!-- File Info -->
            <div class="space-y-2">
              <div>
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  自定义名称
                </label>
                <input
                  v-model="file.customName"
                  type="text"
                  placeholder="自定义文件名"
                  class="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>{{ formatFileSize(file.file.size) }}</span>
                <span>{{ file.file.type }}</span>
              </div>

              <!-- Progress -->
              <div v-if="file.uploading" class="space-y-1">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    class="bg-primary-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                    :style="{ width: (file.progress || 0) + '%' }"
                  ></div>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-500 text-right">
                  {{ file.progress || 0 }}%
                </p>
              </div>

              <!-- Upload Status -->
              <div v-if="file.uploadedUrl" class="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <span>✓</span>
                <span class="truncate">上传成功</span>
              </div>
              <div v-if="file.error" class="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <span>✗</span>
                <span class="truncate">{{ file.error }}</span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-2 mt-3">
              <button
                @click="uploadFile(index)"
                :disabled="file.uploading || !configStore.config?.storage.repository.name"
                class="flex-1 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                <svg v-if="file.uploading" class="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{{ file.uploading ? '上传中' : '上传' }}</span>
              </button>
              
              <button
                @click="copyUrl(index)"
                :disabled="!file.uploadedUrl"
                class="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Results -->
    <div v-if="uploadResults.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          上传结果 ({{ uploadResults.length }})
        </h3>
        <div class="flex gap-2">
          <button
            @click="copyAllUrls"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            📋 复制全部链接
          </button>
          <button
            @click="exportResults"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            💾 导出结果
          </button>
        </div>
      </div>
      
      <div class="space-y-3 max-h-96 overflow-y-auto pr-2">
        <div 
          v-for="(result, idx) in uploadResults" 
          :key="idx" 
          class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <span class="text-green-500 mt-0.5">✓</span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2">
              <span class="font-medium text-gray-900 dark:text-white truncate">{{ result.name }}</span>
              <span class="text-xs text-gray-500 dark:text-gray-500">{{ new Date(result.timestamp).toLocaleString() }}</span>
            </div>
            <div class="mt-1 text-sm text-gray-600 dark:text-gray-400 break-all">
              {{ result.url }}
            </div>
          </div>
          <button
            @click="copySingleResultUrl(result.url)"
            class="text-gray-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex-shrink-0 mt-0.5"
            :title="'复制链接'"
          >
            📋
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { useConfigStore } from '~/stores/config'
import { useToastStore } from '~/stores/toast'
import { apiFetch } from '~/utils/api-fetch'

interface SelectedFile {
  id: string
  file: File
  preview?: string
  customName?: string
  uploading: boolean
  progress: number
  uploadedUrl?: string
  error?: string
}

interface UploadResult {
  name: string
  url: string
  timestamp: string
}

const configStore = useConfigStore()
const toastStore = useToastStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectedFiles = ref<SelectedFile[]>([])
const uploading = ref(false)
const uploadResults = ref<UploadResult[]>([])

// 处理文件选择
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    Array.from(target.files).forEach(file => addFile(file))
    target.value = '' // Reset input
  }
}

// 处理拖放
const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    Array.from(event.dataTransfer.files).forEach(file => {
      if (file.type.startsWith('image/')) {
        addFile(file)
      } else {
        toastStore.error(`${file.name}: 不是图片文件`)
      }
    })
  }
}

// 添加文件
const addFile = (file: File) => {
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    toastStore.error(`${file.name}: 文件大小超过 10MB 限制`)
    return
  }

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  const selectedFile: SelectedFile = {
    id,
    file,
    customName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
    uploading: false,
    progress: 0
  }

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    selectedFile.preview = e.target?.result as string
  }
  reader.readAsDataURL(file)

  selectedFiles.value.push(selectedFile)
}

// 移除文件
const removeFile = (index: number) => {
  const file = selectedFiles.value[index]
  if (file) {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
    selectedFiles.value.splice(index, 1)
  }
}

// 清空所有
const clearAll = () => {
  selectedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  selectedFiles.value = []
}

// 上传单个文件
const uploadFile = async (index: number) => {
  const file = selectedFiles.value[index]
  if (!file || file.uploading || !configStore.config?.storage.repository.name) return

  file.uploading = true
  file.progress = 0
  file.error = undefined

  // 将progressInterval定义移到try块外部，确保catch块能访问到
  let progressInterval: NodeJS.Timeout | undefined
  
  try {
    // 准备文件名
    let fileName = file.customName || file.file.name
    if (!fileName.includes('.')) {
      const extension = file.file.name.split('.').pop()
      if (extension) {
        fileName += '.' + extension
      }
    }

    // 添加时间戳目录
    let uploadPath = configStore.config?.storage.directory.path || 'images'
    if (configStore.config?.storage.directory.autoPattern === 'year/month/day') {
      const now = new Date()
      const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      uploadPath = `${uploadPath}/${datePath}`
    }

    const fullPath = `${uploadPath}/${fileName}`

    // 模拟进度更新
    progressInterval = setInterval(() => {
      if (file.progress < 85) {
        file.progress += Math.random() * 15
        if (file.progress > 85) file.progress = 85
      }
    }, 200)

    // 读取文件内容
    const arrayBuffer = await file.file.arrayBuffer()
    const base64Content = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    // 上传到 GitHub
    const response = await apiFetch('/api/upload/image', {
      method: 'PUT',
      body: {
        path: fullPath,
        content: base64Content,
        message: `Upload: ${fileName}`,
        repository: {
          owner: configStore.config.storage.repository.owner,
          name: configStore.config.storage.repository.name,
          branch: configStore.config.storage.repository.branch
        }
      }
    })

    if (progressInterval) {
      clearInterval(progressInterval)
    }
    file.progress = 100
    file.uploadedUrl = response.content.download_url
    
    // 应用自定义域名
    if (configStore.config?.links.customDomain && file.uploadedUrl) {
      file.uploadedUrl = file.uploadedUrl.replace(
        `https://raw.githubusercontent.com/${configStore.config.storage.repository.owner}/${configStore.config.storage.repository.name}/${configStore.config.storage.repository.branch}/`,
        configStore.config.links.customDomain.replace(/\/$/, '') + '/'
      )
    }

    // 添加到上传结果
    if (file.uploadedUrl) {
      const uploadResult: UploadResult = {
        name: fileName,
        url: file.uploadedUrl,
        timestamp: new Date().toISOString()
      }
      uploadResults.value.unshift(uploadResult)
    }

    toastStore.success(`${fileName}: 上传成功`)
  } catch (error: any) {
    if (progressInterval) {
      clearInterval(progressInterval)
    }
    file.error = error.message || '上传失败'
    toastStore.error(`${file.customName || file.file.name}: 上传失败`)
  } finally {
    file.uploading = false
    setTimeout(() => {
      file.progress = 0
    }, 1000)
  }
}

// 上传所有
const uploadAll = async () => {
  if (!configStore.config?.storage.repository.name) {
    toastStore.error('请先配置仓库信息')
    return
  }

  if (selectedFiles.value.length === 0) {
    toastStore.warning('没有待上传文件')
    return
  }

  uploading.value = true

  try {
    // 上传所有文件（并行上传，最多同时上传3个）
    const batchSize = 3
    for (let i = 0; i < selectedFiles.value.length; i += batchSize) {
      const batch = selectedFiles.value.slice(i, i + batchSize)
      await Promise.all(batch.map((_, idx) => uploadFile(i + idx)))
    }

    toastStore.success(`已完成 ${selectedFiles.value.length} 个文件上传`)
  } catch (error) {
    toastStore.error('批量上传失败')
  } finally {
    uploading.value = false
  }
}

// 复制单个 URL
const copyUrl = async (index: number) => {
  const file = selectedFiles.value[index]
  if (!file || !file.uploadedUrl) return

  try {
    await navigator.clipboard.writeText(file.uploadedUrl)
    toastStore.success('链接已复制到剪贴板')
  } catch (error) {
    toastStore.error('复制失败，请手动复制')
  }
}

// 复制结果中的单个 URL
const copySingleResultUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    toastStore.success('链接已复制到剪贴板')
  } catch (error) {
    toastStore.error('复制失败，请手动复制')
  }
}

// 复制所有 URL
const copyAllUrls = async () => {
  if (uploadResults.value.length === 0) return

  const text = uploadResults.value.map(r => `${r.name}: ${r.url}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toastStore.success(`已复制 ${uploadResults.value.length} 个链接到剪贴板`)
  } catch (error) {
    toastStore.error('复制失败，请手动复制')
  }
}

// 导出结果
const exportResults = () => {
  if (uploadResults.value.length === 0) return

  const data = uploadResults.value
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `upload-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  toastStore.success('导出成功')
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 清理资源
onUnmounted(() => {
  selectedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
})
</script>