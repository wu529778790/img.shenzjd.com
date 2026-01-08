<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        图片上传
      </h1>

      <!-- Upload Area -->
      <div
        class="border-2 border-dashed rounded-xl p-8 text-center transition-colors mb-6"
        :class="[
          isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          拖拽图片到此处或点击选择
        </p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          支持的格式：JPG、PNG、GIF、WebP、SVG
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
          @click="$refs.fileInput?.click()"
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          选择文件
        </button>
      </div>

      <!-- Batch Actions -->
      <div class="flex flex-wrap gap-3 mb-6" v-if="selectedFiles.length > 0">
        <button
          @click="uploadAll"
          :disabled="uploading || !configStore.config?.repository"
          class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="uploading" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{{ uploading ? '上传中...' : '全部上传' }} ({{ selectedFiles.length }})</span>
        </button>

        <button
          @click="clearAll"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
        >
          清空
        </button>

        <button
          @click="compressAll"
          :disabled="compressing"
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="compressing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{{ compressing ? '压缩中...' : '全部压缩' }}</span>
        </button>

        <button
          @click="downloadAll"
          :disabled="selectedFiles.length === 0"
          class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          下载全部
        </button>
      </div>

      <!-- Warning -->
      <div v-if="!configStore.config?.repository" class="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p class="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ 请先配置仓库信息
        </p>
      </div>

      <!-- File List -->
      <div v-if="selectedFiles.length > 0" class="space-y-4">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          文件列表
        </h2>

        <div
          v-for="(file, index) in selectedFiles"
          :key="file.id"
          class="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <div class="flex items-start gap-4">
            <!-- Preview -->
            <div class="flex-shrink-0">
              <img
                v-if="file.preview"
                :src="file.preview"
                :alt="file.file.name"
                class="w-20 h-20 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
              />
              <div v-else class="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white truncate">
                    {{ file.file.name }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    {{ formatFileSize(file.file.size) }} • {{ file.file.type }}
                  </p>
                  <p v-if="file.uploadedUrl" class="text-sm text-green-600 dark:text-green-400 mt-1 break-all">
                    ✓ {{ file.uploadedUrl }}
                  </p>
                  <p v-if="file.error" class="text-sm text-red-600 dark:text-red-400 mt-1">
                    ✗ {{ file.error }}
                  </p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-2 flex-shrink-0">
                  <button
                    @click="uploadFile(index)"
                    :disabled="file.uploading || !configStore.config?.repository"
                    class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ file.uploading ? '上传中...' : '上传' }}
                  </button>

                  <button
                    @click="compressFile(index)"
                    :disabled="file.compressing"
                    class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ file.compressing ? '压缩中...' : '压缩' }}
                  </button>

                  <button
                    @click="copyUrl(index)"
                    :disabled="!file.uploadedUrl"
                    class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    复制链接
                  </button>

                  <button
                    @click="removeFile(index)"
                    class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    移除
                  </button>
                </div>
              </div>

              <!-- Progress -->
              <div v-if="file.uploading || file.compressing" class="mt-3">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full transition-all"
                    :style="{ width: (file.progress || 0) + '%' }"
                  ></div>
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {{ file.progress || 0 }}%
                </p>
              </div>

              <!-- Custom Name -->
              <div class="mt-3" v-if="!file.uploadedUrl">
                <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  自定义名称
                </label>
                <input
                  v-model="file.customName"
                  type="text"
                  placeholder="输入自定义文件名"
                  class="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Results -->
      <div v-if="uploadResults.length > 0" class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <h3 class="font-semibold text-green-800 dark:text-green-200 mb-2">
          上传结果
        </h3>
        <div class="space-y-2">
          <div v-for="(result, idx) in uploadResults" :key="idx" class="text-sm text-green-700 dark:text-green-300 break-all">
            <span class="font-medium">{{ result.name }}:</span> {{ result.url }}
          </div>
        </div>
        <div class="mt-3 flex gap-2">
          <button
            @click="copyAllUrls"
            class="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
          >
            复制全部链接
          </button>
          <button
            @click="exportResults"
            class="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-sm font-medium rounded transition-colors"
          >
            导出结果
          </button>
        </div>
      </div>

      <!-- Batch Upload Modal -->
      <div v-if="showBatchModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div class="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full border border-gray-200 dark:border-gray-700">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
            批量上传
          </h3>
          <div class="space-y-3 mb-4">
            <div v-for="(file, idx) in batchUploadQueue" :key="idx" class="text-sm">
              <div class="flex items-center justify-between">
                <span class="truncate">{{ file.name }}</span>
                <span v-if="file.status === 'uploading'" class="text-blue-600">上传中...</span>
                <span v-else-if="file.status === 'success'" class="text-green-600">✓</span>
                <span v-else-if="file.status === 'error'" class="text-red-600">✗</span>
                <span v-else class="text-gray-500">等待中</span>
              </div>
              <div v-if="file.progress !== undefined" class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 mt-1">
                <div class="bg-primary-600 h-1 rounded-full" :style="{ width: file.progress + '%' }"></div>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-2">
            <button
              @click="showBatchModal = false"
              class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
            >
              关闭
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

interface SelectedFile {
  id: string
  file: File
  preview?: string
  customName?: string
  uploading?: boolean
  compressing?: boolean
  progress?: number
  uploadedUrl?: string
  error?: string
  compressedBlob?: Blob
}

interface BatchFile {
  name: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress?: number
  url?: string
}

const configStore = useConfigStore()
const toastStore = useToastStore()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const selectedFiles = ref<SelectedFile[]>([])
const uploading = ref(false)
const compressing = ref(false)
const uploadResults = ref<{ name: string; url: string }[]>([])
const showBatchModal = ref(false)
const batchUploadQueue = ref<BatchFile[]>([])

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
      }
    })
  }
}

// 添加文件
const addFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    toastStore.error(`${file.name}: 不是图片文件`)
    return
  }

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  const selectedFile: SelectedFile = {
    id,
    file,
    customName: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
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
  if (file.preview) {
    URL.revokeObjectURL(file.preview)
  }
  selectedFiles.value.splice(index, 1)
}

// 清空所有
const clearAll = () => {
  selectedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
  selectedFiles.value = []
  uploadResults.value = []
}

// 压缩单个文件
const compressFile = async (index: number) => {
  const file = selectedFiles.value[index]
  if (file.compressing) return

  file.compressing = true
  file.progress = 0

  try {
    // 模拟压缩进度
    const interval = setInterval(() => {
      if (file.progress! < 90) {
        file.progress! += 10
      }
    }, 100)

    const compressed = await compressImage(file.file, configStore.config?.imageCompression || 'none')
    clearInterval(interval)
    file.progress = 100
    file.compressedBlob = compressed

    // 更新文件大小显示
    const newFile = new File([compressed], file.file.name, { type: file.file.type })
    file.file = newFile

    toastStore.success(`${file.customName}: 压缩成功`)
  } catch (error) {
    toastStore.error(`${file.customName}: 压缩失败`)
  } finally {
    file.compressing = false
    setTimeout(() => {
      file.progress = 0
    }, 1000)
  }
}

// 压缩所有
const compressAll = async () => {
  compressing.value = true
  for (let i = 0; i < selectedFiles.value.length; i++) {
    if (!selectedFiles.value[i].compressedBlob) {
      await compressFile(i)
    }
  }
  compressing.value = false
  toastStore.success('全部压缩完成')
}

// 上传单个文件
const uploadFile = async (index: number) => {
  const file = selectedFiles.value[index]
  if (file.uploading || !configStore.config?.repository) return

  file.uploading = true
  file.progress = 0
  file.error = undefined

  try {
    // 准备文件名
    let fileName = file.customName || file.file.name
    if (!fileName.includes('.')) {
      fileName += '.' + file.file.name.split('.').pop()
    }

    // 添加时间戳目录
    let uploadPath = configStore.config.directory || 'images'
    if (configStore.config.timestampDir) {
      const now = new Date()
      const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      uploadPath = `${uploadPath}/${datePath}`
    }

    const fullPath = `${uploadPath}/${fileName}`

    // 读取文件内容
    const arrayBuffer = await file.file.arrayBuffer()
    const base64Content = btoa(
      new Uint8Array(arrayBuffer)
        .reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    // 上传到 GitHub
    const response = await $fetch('/api/upload/image', {
      method: 'PUT',
      body: {
        path: fullPath,
        content: base64Content,
        message: `Upload: ${fileName}`,
        repository: {
          owner: configStore.config.repositoryOwner,
          name: configStore.config.repositoryName,
          branch: configStore.config.branch
        }
      },
      headers: useRequestHeaders(['cookie'])
    })

    file.uploadedUrl = response.content.download_url
    if (configStore.config.customDomain) {
      file.uploadedUrl = file.uploadedUrl.replace(
        `https://raw.githubusercontent.com/${configStore.config.repositoryOwner}/${configStore.config.repositoryName}/${configStore.config.branch}/`,
        configStore.config.customDomain.replace(/\/$/, '') + '/'
      )
    }

    uploadResults.value.push({
      name: fileName,
      url: file.uploadedUrl
    })

    toastStore.success(`${fileName}: 上传成功`)
  } catch (error: any) {
    file.error = error.message || '上传失败'
    toastStore.error(`${file.customName}: ${'上传失败'}`)
  } finally {
    file.uploading = false
    file.progress = 100
    setTimeout(() => {
      file.progress = 0
    }, 1000)
  }
}

// 上传所有
const uploadAll = async () => {
  if (!configStore.config?.repository) {
    toastStore.error('请先配置仓库信息')
    return
  }

  uploading.value = true
  showBatchModal.value = true

  // 初始化队列
  batchUploadQueue.value = selectedFiles.value.map(file => ({
    name: file.customName || file.file.name,
    status: 'pending'
  }))

  for (let i = 0; i < selectedFiles.value.length; i++) {
    const file = selectedFiles.value[i]
    batchUploadQueue.value[i].status = 'uploading'

    try {
      await uploadFile(i)
      batchUploadQueue.value[i].status = 'success'
      batchUploadQueue.value[i].url = file.uploadedUrl
    } catch (error) {
      batchUploadQueue.value[i].status = 'error'
    }
  }

  uploading.value = false
  toastStore.success('批量上传完成')
}

// 复制单个 URL
const copyUrl = async (index: number) => {
  const file = selectedFiles.value[index]
  if (!file.uploadedUrl) return

  try {
    await navigator.clipboard.writeText(file.uploadedUrl)
    toastStore.success('复制成功')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// 复制所有 URL
const copyAllUrls = async () => {
  if (uploadResults.value.length === 0) return

  const text = uploadResults.value.map(r => `${r.name}: ${r.url}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toastStore.success('全部链接已复制')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// 导出结果
const exportResults = () => {
  if (uploadResults.value.length === 0) return

  const data = uploadResults.value.map(r => ({
    name: r.name,
    url: r.url,
    timestamp: new Date().toISOString()
  }))

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `upload-results-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  toastStore.success('导出成功')
}

// 下载所有文件
const downloadAll = () => {
  selectedFiles.value.forEach(file => {
    if (file.compressedBlob) {
      const url = URL.createObjectURL(file.compressedBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `compressed-${file.file.name}`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      const url = URL.createObjectURL(file.file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  })
  toastStore.success('下载开始')
}

// 压缩图片
const compressImage = async (file: File, level: string): Promise<Blob> => {
  if (level === 'none') {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!

      // 计算压缩比例
      let quality = 0.92
      if (level === 'light') quality = 0.85
      if (level === 'medium') quality = 0.7
      if (level === 'heavy') quality = 0.5

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Compression failed'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onUnmounted(() => {
  clearAll()
})
</script>
