<template>
  <div class="max-w-7xl mx-auto">
    <!-- 未登录状态 -->
    <div v-if="!authStore.isAuthenticated" class="text-center py-12">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 border border-gray-200 dark:border-gray-700 max-w-md mx-auto">
        <div class="w-20 h-20 bg-primary-600 rounded-2xl mx-auto mb-6 flex items-center justify-center">
          <span class="text-white font-bold text-3xl">IMG</span>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          欢迎使用图床应用
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mb-8">
          请先登录以开始使用
        </p>
        <button
          @click="showLoginModal = true"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          登录
        </button>
      </div>
    </div>

    <!-- 已登录状态 -->
    <div v-else>
      <!-- 统计卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">当前仓库</div>
          <div class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ configStore.config?.storage.repository.owner }}/{{ configStore.config?.storage.repository.name || '未配置' }}
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">存储路径</div>
          <div class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ configStore.config?.storage.directory.path || '未配置' }}
          </div>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">用户</div>
          <div class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ authStore.user?.login || '-' }}
          </div>
        </div>
      </div>

      <!-- 配置提示 -->
      <div v-if="!configStore.config?.storage.repository.name" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
        <div class="flex items-center gap-3">
          <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="flex-1">
            <h3 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">需要配置</h3>
            <p class="text-sm text-yellow-700 dark:text-yellow-300">请先在设置页配置仓库信息以开始使用</p>
          </div>
          <NuxtLink to="/settings">
            <button class="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors whitespace-nowrap">
              前往设置
            </button>
          </NuxtLink>
        </div>
      </div>

      <!-- 上传区域 -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
        <!-- Upload Area -->
        <div
          class="border-2 border-dashed rounded-t-xl p-8 text-center transition-all duration-300"
          :class="[
            isDragging 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800/80'
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            拖拽图片到此处或点击选择
          </h2>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
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
            :disabled="!configStore.config?.storage.repository.name"
            class="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            选择图片文件
          </button>
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
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ uploading ? '上传中...' : '全部上传' }}
              </button>
              <button
                @click="clearAll"
                class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
              >
                清空
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="(file, index) in selectedFiles"
              :key="file.id"
              class="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div class="relative mb-3">
                <img
                  v-if="file.preview"
                  :src="file.preview"
                  :alt="file.file.name"
                  class="w-full h-32 object-cover rounded-lg"
                />
                <button
                  @click="removeFile(index)"
                  class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {{ file.file.name }}
              </div>
              <div v-if="file.uploading" class="mb-2">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    class="bg-primary-600 h-2 rounded-full transition-all"
                    :style="{ width: (file.progress || 0) + '%' }"
                  ></div>
                </div>
              </div>
              <div v-if="file.uploadedUrl" class="text-sm text-green-600 dark:text-green-400 mb-2">
                ✓ 上传成功
              </div>
              <button
                @click="uploadFile(index)"
                :disabled="file.uploading || !configStore.config?.storage.repository.name"
                class="w-full px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                {{ file.uploading ? '上传中' : '上传' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传结果 -->
      <div v-if="uploadResults.length > 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            上传结果 ({{ uploadResults.length }})
          </h3>
          <button
            @click="copyAllUrls"
            class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors"
          >
            复制全部链接
          </button>
        </div>
        <div class="space-y-2 max-h-64 overflow-y-auto">
          <div
            v-for="(result, idx) in uploadResults"
            :key="idx"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ result.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ result.url }}</div>
            </div>
            <button
              @click="copySingleUrl(result.url)"
              class="ml-2 px-2 py-1 text-gray-500 hover:text-primary-600 text-sm"
            >
              复制
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal v-model:visible="showLoginModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()
const showLoginModal = ref(false)

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
    target.value = ''
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
  if (file.size > 10 * 1024 * 1024) {
    toastStore.error(`${file.name}: 文件大小超过 10MB`)
    return
  }

  const id = Date.now() + Math.random().toString(36).substr(2, 9)
  const selectedFile: SelectedFile = {
    id,
    file,
    uploading: false,
    progress: 0
  }

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
  if (file?.preview) {
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
}

// 上传单个文件
const uploadFile = async (index: number) => {
  const file = selectedFiles.value[index]
  if (!file || file.uploading || !configStore.config?.storage.repository.name) return

  file.uploading = true
  file.progress = 0

  try {
    let fileName = file.file.name
    let uploadPath = configStore.config.storage.directory.path || 'images'
    
    if (configStore.config.storage.directory.autoPattern === 'year/month/day') {
      const now = new Date()
      const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
      uploadPath = `${uploadPath}/${datePath}`
    }

    const fullPath = `${uploadPath}/${fileName}`

    // 模拟进度
    const progressInterval = setInterval(() => {
      if (file.progress < 85) {
        file.progress += Math.random() * 15
        if (file.progress > 85) file.progress = 85
      }
    }, 200)

    const arrayBuffer = await file.file.arrayBuffer()
    const base64Content = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

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

    clearInterval(progressInterval)
    file.progress = 100
    file.uploadedUrl = response.content.download_url

    if (configStore.config.links.customDomain && file.uploadedUrl) {
      file.uploadedUrl = file.uploadedUrl.replace(
        `https://raw.githubusercontent.com/${configStore.config.storage.repository.owner}/${configStore.config.storage.repository.name}/${configStore.config.storage.repository.branch}/`,
        configStore.config.links.customDomain.replace(/\/$/, '') + '/'
      )
    }

    if (file.uploadedUrl) {
      uploadResults.value.unshift({
        name: fileName,
        url: file.uploadedUrl,
        timestamp: new Date().toISOString()
      })
    }

    toastStore.success(`${fileName}: 上传成功`)
  } catch (error: any) {
    file.error = error.message || '上传失败'
    toastStore.error(`${file.file.name}: 上传失败`)
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

  uploading.value = true
  try {
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
const copySingleUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url)
    toastStore.success('链接已复制')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// 复制所有 URL
const copyAllUrls = async () => {
  if (uploadResults.value.length === 0) return
  const text = uploadResults.value.map(r => r.url).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    toastStore.success(`已复制 ${uploadResults.value.length} 个链接`)
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// 初始化
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await configStore.loadConfig()
    } catch (error) {
      toastStore.error('加载配置失败')
    }
  }
})

// 清理资源
onUnmounted(() => {
  selectedFiles.value.forEach(file => {
    if (file.preview) {
      URL.revokeObjectURL(file.preview)
    }
  })
})
</script>