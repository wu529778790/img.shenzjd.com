<template>
  <div class="max-w-6xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white p-6 border-b border-gray-200 dark:border-gray-700">
        设置
      </h1>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
          :class="
            activeTab === tab.id
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          "
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="p-6">
        <!-- 仓库配置 -->
        <div v-if="activeTab === 'repository'" class="space-y-6">
          <div v-if="!authStore.isAuthenticated" class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400 mb-4">请先登录</p>
            <button
              @click="showLoginModal = true"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg"
            >
              登录
            </button>
          </div>

          <div v-else class="space-y-6">
            <!-- Repository Configuration -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">仓库配置</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">仓库所有者</label>
                  <input
                    v-model="config.repositoryOwner"
                    type="text"
                    :placeholder="authStore.user?.login || 'username'"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">仓库名称</label>
                  <input
                    v-model="config.repositoryName"
                    type="text"
                    placeholder="img.shenzjd.com"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">分支</label>
                  <div class="flex gap-2">
                    <select
                      v-model="config.branch"
                      class="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="" disabled>选择分支</option>
                      <option v-for="branch in branches" :key="branch" :value="branch">{{ branch }}</option>
                    </select>
                    <button
                      @click="loadBranches"
                      :disabled="loadingBranches || !config.repositoryOwner || !config.repositoryName"
                      class="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                    >
                      刷新
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">存储目录</label>
                  <input
                    v-model="config.directory"
                    type="text"
                    placeholder="images"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <!-- Advanced Settings -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">高级设置</h2>
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CDN</label>
                  <select
                    v-model="config.cdn"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="github">GitHub</option>
                    <option value="jsdelivr">jsDelivr</option>
                    <option value="staticaly">Staticaly</option>
                    <option value="chinajsdelivr">ChinaJSdelivr</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">自定义域名</label>
                  <input
                    v-model="config.customDomain"
                    type="text"
                    placeholder="https://cdn.example.com"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图片压缩</label>
                  <select
                    v-model="config.imageCompression"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="none">不压缩</option>
                    <option value="light">轻度压缩</option>
                    <option value="medium">中度压缩</option>
                    <option value="heavy">重度压缩</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">水印文字</label>
                  <input
                    v-model="config.watermarkText"
                    type="text"
                    placeholder="© Your Name"
                    class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div class="flex items-center">
                  <input
                    v-model="config.timestampDir"
                    type="checkbox"
                    class="w-4 h-4 text-primary-600 rounded"
                  />
                  <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">按年/月/日自动创建目录</label>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="saveConfig"
                :disabled="saving"
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg disabled:opacity-50"
              >
                {{ saving ? '保存中...' : '保存配置' }}
              </button>
              <button
                @click="loadFromGitHub"
                :disabled="loadingGitHub"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {{ loadingGitHub ? '加载中...' : '从 GitHub 加载' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 应用设置 -->
        <div v-if="activeTab === 'app'" class="space-y-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">主题设置</h2>
            <div class="grid grid-cols-3 gap-3">
              <button
                @click="setTheme('light')"
                class="p-4 border-2 rounded-lg"
                :class="theme === 'light' ? 'border-primary-500' : 'border-gray-300'"
              >
                <div class="w-full h-12 bg-gray-100 rounded mb-2"></div>
                <span class="text-sm">浅色</span>
              </button>
              <button
                @click="setTheme('dark')"
                class="p-4 border-2 rounded-lg"
                :class="theme === 'dark' ? 'border-primary-500' : 'border-gray-300'"
              >
                <div class="w-full h-12 bg-gray-800 rounded mb-2"></div>
                <span class="text-sm">深色</span>
              </button>
              <button
                @click="setTheme('auto')"
                class="p-4 border-2 rounded-lg"
                :class="theme === 'auto' ? 'border-primary-500' : 'border-gray-300'"
              >
                <div class="w-full h-12 bg-gradient-to-r from-gray-100 to-gray-800 rounded mb-2"></div>
                <span class="text-sm">自动</span>
              </button>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">上传设置</h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">最大文件大小 (MB)</label>
                <input
                  v-model.number="settings.maxFileSize"
                  type="number"
                  min="1"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div class="flex items-center">
                <input
                  v-model="settings.copyAfterUpload"
                  type="checkbox"
                  class="w-4 h-4 text-primary-600 rounded"
                />
                <label class="ml-2 text-sm text-gray-700 dark:text-gray-300">上传后自动复制链接</label>
              </div>
            </div>
          </div>
        </div>

        <!-- 工具箱 -->
        <div v-if="activeTab === 'tools'" class="space-y-6">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Base64 编解码</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输入</label>
                <textarea
                  v-model="base64Input"
                  class="w-full h-32 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs"
                ></textarea>
                <div class="mt-2 flex gap-2">
                  <input ref="base64FileInput" type="file" accept="image/*" class="hidden" @change="fileToBase64" />
                  <button @click="base64FileInput?.click()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded">
                    选择文件
                  </button>
                  <button @click="convertToBase64" class="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded">
                    转换
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">输出</label>
                <textarea
                  v-model="base64Output"
                  readonly
                  class="w-full h-32 px-3 py-2 bg-gray-50 dark:bg-gray-900/30 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs"
                ></textarea>
                <button
                  @click="copyBase64"
                  :disabled="!base64Output"
                  class="mt-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded disabled:opacity-50"
                >
                  复制
                </button>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">URL 生成器</h2>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">基础域名</label>
                <input
                  v-model="urlBase"
                  type="text"
                  placeholder="https://raw.githubusercontent.com/user/repo/branch"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">文件路径</label>
                <input
                  v-model="urlPath"
                  type="text"
                  placeholder="images/example.png"
                  class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                />
              </div>
              <div class="flex gap-2">
                <button @click="generateUrl" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">
                  生成
                </button>
                <button
                  @click="copyGeneratedUrl"
                  :disabled="!generatedUrl"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50"
                >
                  复制
                </button>
              </div>
              <div v-if="generatedUrl" class="p-3 bg-gray-50 dark:bg-gray-900/30 rounded-lg">
                <div class="text-sm font-mono break-all">{{ generatedUrl }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Login Modal -->
    <LoginModal v-model:visible="showLoginModal" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { apiFetch } from '~/utils/api-fetch'

const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()
const showLoginModal = ref(false)

const activeTab = ref('repository')
const tabs = [
  { id: 'repository', label: '仓库配置' },
  { id: 'app', label: '应用设置' },
  { id: 'tools', label: '工具箱' }
]

// Repository config
const config = ref({
  repositoryOwner: '',
  repositoryName: '',
  branch: '',
  directory: '',
  cdn: 'github',
  customDomain: '',
  watermarkText: '',
  imageCompression: 'none',
  timestampDir: false
})

const branches = ref<string[]>([])
const loadingBranches = ref(false)
const saving = ref(false)
const loadingGitHub = ref(false)

// App settings
const theme = ref<'light' | 'dark' | 'auto'>('auto')
const settings = ref({
  maxFileSize: 10,
  copyAfterUpload: true
})

// Tools
const base64Input = ref('')
const base64Output = ref('')
const base64FileInput = ref<HTMLInputElement | null>(null)
const urlBase = ref('')
const urlPath = ref('')
const generatedUrl = ref('')

// Load config
const loadConfigFromStore = async () => {
  try {
    await configStore.loadConfig()
    if (configStore.config) {
      config.value.repositoryOwner = configStore.config.storage.repository.owner
      config.value.repositoryName = configStore.config.storage.repository.name
      config.value.branch = configStore.config.storage.repository.branch
      config.value.directory = configStore.config.storage.directory.path
      config.value.cdn = configStore.config.links.cdn
      config.value.customDomain = configStore.config.links.customDomain
      config.value.watermarkText = configStore.config.image.watermark.text
      config.value.imageCompression = configStore.config.image.autoCompress ? 'medium' : 'none'
      config.value.timestampDir = configStore.config.storage.directory.autoPattern === 'year/month/day'
    }
  } catch (error) {
    toastStore.error('加载配置失败')
  }
}

const loadBranches = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName) return
  loadingBranches.value = true
  try {
    const response = await apiFetch('/api/repo/branches', {
      query: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName
      }
    })
    branches.value = response.data?.map((b: any) => b.name) || []
    toastStore.success(`加载了 ${branches.value.length} 个分支`)
  } catch (error: any) {
    toastStore.error(error.message || '加载分支失败')
  } finally {
    loadingBranches.value = false
  }
}

const saveConfig = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName || !config.value.branch) {
    toastStore.error('请填写所有必填项')
    return
  }

  saving.value = true
  try {
    if (!configStore.config) {
      configStore.config = {
        version: '3.0.0',
        storage: {
          repository: {
            owner: config.value.repositoryOwner,
            name: config.value.repositoryName,
            branch: config.value.branch
          },
          directory: {
            mode: 'custom',
            path: config.value.directory,
            autoPattern: config.value.timestampDir ? 'year/month/day' : 'date'
          },
          naming: { strategy: 'hash', prefix: '', suffix: '' }
        },
        image: {
          autoCompress: config.value.imageCompression !== 'none',
          compressionQuality: 0.85,
          maxWidth: 1920,
          maxHeight: 1080,
          watermark: {
            enabled: !!config.value.watermarkText,
            text: config.value.watermarkText,
            position: 'bottom-right',
            opacity: 0.5
          }
        },
        links: {
          format: 'markdown',
          cdn: config.value.cdn as any,
          customDomain: config.value.customDomain
        },
        user: {
          id: authStore.user?.id || 0,
          login: authStore.user?.login || '',
          email: authStore.user?.email || '',
          avatar: authStore.user?.avatarUrl || ''
        },
        lastSync: new Date().toISOString()
      }
    } else {
      configStore.config.storage.repository.owner = config.value.repositoryOwner
      configStore.config.storage.repository.name = config.value.repositoryName
      configStore.config.storage.repository.branch = config.value.branch
      configStore.config.storage.directory.path = config.value.directory
      configStore.config.storage.directory.autoPattern = config.value.timestampDir ? 'year/month/day' : 'date'
      configStore.config.image.autoCompress = config.value.imageCompression !== 'none'
      configStore.config.image.watermark.text = config.value.watermarkText
      configStore.config.image.watermark.enabled = !!config.value.watermarkText
      configStore.config.links.cdn = config.value.cdn as any
      configStore.config.links.customDomain = config.value.customDomain
    }

    await configStore.saveConfig()
    toastStore.success('保存成功')
  } catch (error) {
    toastStore.error('保存失败')
  } finally {
    saving.value = false
  }
}

const loadFromGitHub = async () => {
  loadingGitHub.value = true
  try {
    const response = await apiFetch('/api/user/config', {
      query: {
        owner: config.value.repositoryOwner,
        repo: config.value.repositoryName,
        branch: config.value.branch
      }
    })
    if (response.success && response.data) {
      await configStore.loadConfig()
      await loadConfigFromStore()
      toastStore.success('从GitHub加载配置成功')
    }
  } catch (error: any) {
    toastStore.error('加载配置失败')
  } finally {
    loadingGitHub.value = false
  }
}

// Theme
const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
  theme.value = newTheme
  const html = document.documentElement
  if (newTheme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)
  } else {
    html.classList.toggle('dark', newTheme === 'dark')
  }
  localStorage.setItem('theme', newTheme)
}

// Base64
const convertToBase64 = () => {
  if (!base64Input.value) return
  try {
    if (base64Input.value.startsWith('data:image/')) {
      base64Output.value = base64Input.value
    } else {
      base64Output.value = 'data:text/plain;base64,' + btoa(base64Input.value)
    }
    toastStore.success('转换成功')
  } catch (error) {
    toastStore.error('转换失败')
  }
}

const fileToBase64 = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.[0]) return
  const reader = new FileReader()
  reader.onload = (e) => {
    base64Output.value = e.target?.result as string
    toastStore.success('文件已转换')
  }
  reader.readAsDataURL(target.files[0])
  target.value = ''
}

const copyBase64 = async () => {
  try {
    await navigator.clipboard.writeText(base64Output.value)
    toastStore.success('复制成功')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// URL Generator
const generateUrl = () => {
  if (!urlBase.value || !urlPath.value) {
    toastStore.error('请填写域名和路径')
    return
  }
  let base = urlBase.value.replace(/\/$/, '')
  let path = urlPath.value.replace(/^\//, '')
  generatedUrl.value = `${base}/${path}`
  toastStore.success('URL 生成成功')
}

const copyGeneratedUrl = async () => {
  try {
    await navigator.clipboard.writeText(generatedUrl.value)
    toastStore.success('复制成功')
  } catch (error) {
    toastStore.error('复制失败')
  }
}

// Initialize
onMounted(async () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
  if (savedTheme) {
    setTheme(savedTheme)
  }
  
  if (authStore.isAuthenticated) {
    await loadConfigFromStore()
    if (config.value.repositoryOwner && config.value.repositoryName) {
      await loadBranches()
    }
  }
})

watch(() => authStore.isAuthenticated, async (isAuth) => {
  if (isAuth) {
    await loadConfigFromStore()
  }
})
</script>