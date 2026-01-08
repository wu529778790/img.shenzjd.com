<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        设置
      </h1>

      <!-- Language Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          语言设置
        </h2>
        <div class="space-y-2">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="zh-CN"
              v-model="locale"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span class="text-gray-700 dark:text-gray-300">简体中文</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="zh-TW"
              v-model="locale"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span class="text-gray-700 dark:text-gray-300">繁體中文</span>
          </label>
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="language"
              value="en"
              v-model="locale"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span class="text-gray-700 dark:text-gray-300">English</span>
          </label>
        </div>
      </div>

      <!-- Theme Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          主题设置
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            @click="setTheme('light')"
            class="p-4 border-2 rounded-lg transition-all"
            :class="theme === 'light' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
          >
            <div class="w-full h-12 bg-gray-100 rounded mb-2"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">浅色</span>
          </button>
          <button
            @click="setTheme('dark')"
            class="p-4 border-2 rounded-lg transition-all"
            :class="theme === 'dark' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
          >
            <div class="w-full h-12 bg-gray-800 rounded mb-2"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">深色</span>
          </button>
          <button
            @click="setTheme('auto')"
            class="p-4 border-2 rounded-lg transition-all"
            :class="theme === 'auto' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'"
          >
            <div class="w-full h-12 bg-gradient-to-r from-gray-100 to-gray-800 rounded mb-2"></div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">自动</span>
          </button>
        </div>
      </div>

      <!-- Upload Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          上传设置
        </h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              默认压缩
            </label>
            <select
              v-model="settings.defaultCompression"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="none">不压缩</option>
              <option value="light">轻度压缩</option>
              <option value="medium">中度压缩</option>
              <option value="heavy">重度压缩</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              最大文件大小 (MB)
            </label>
            <input
              v-model.number="settings.maxFileSize"
              type="number"
              min="1"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              单个文件大小限制
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              允许的文件类型
            </label>
            <input
              v-model="settings.allowedTypes"
              type="text"
              placeholder="jpg,jpeg,png,gif,webp,svg"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="settings.autoCompress"
              type="checkbox"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              自动压缩图片
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="settings.copyAfterUpload"
              type="checkbox"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              上传后自动复制链接
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="settings.watermarkEnabled"
              type="checkbox"
              class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label class="text-sm text-gray-700 dark:text-gray-300">
              启用默认水印
            </label>
          </div>

          <div v-if="settings.watermarkEnabled" class="ml-6 space-y-2">
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                水印文字
              </label>
              <input
                v-model="settings.watermarkText"
                type="text"
                placeholder="© Your Name"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                水印位置
              </label>
              <select
                v-model="settings.watermarkPosition"
                class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="top-left">左上</option>
                <option value="top-right">右上</option>
                <option value="bottom-left">左下</option>
                <option value="bottom-right">右下</option>
                <option value="center">居中</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Export/Import Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          备份与恢复
        </h2>
        <div class="flex flex-wrap gap-3">
          <button
            @click="exportSettings"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            导出设置
          </button>
          <button
            @click="$refs.importInput?.click()"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            导入设置
          </button>
          <input
            ref="importInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="importSettings"
          />
        </div>
      </div>

      <!-- Data Management -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          数据管理
        </h2>
        <div class="space-y-3">
          <button
            @click="clearCache"
            class="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            清除缓存
          </button>
          <button
            @click="resetSettings"
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
          >
            重置所有设置
          </button>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="saveSettings"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{{ saving ? '保存中...' : '保存' }}</span>
        </button>

        <button
          @click="loadSettings"
          class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
        >
          重新加载
        </button>
      </div>

      <!-- About -->
      <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          关于
        </h2>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>应用名称: <span class="font-medium text-gray-900 dark:text-white">Image Hosting</span></p>
          <p>版本: <span class="font-medium text-gray-900 dark:text-white">2.0.0</span></p>
          <p>作者: <span class="font-medium text-gray-900 dark:text-white">wu529778790</span></p>
          <p>仓库: <a href="https://github.com/wu529778790/img.shenzjd.com" target="_blank" class="text-primary-600 hover:underline">wu529778790/img.shenzjd.com</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useConfigStore } from '~/stores/config'
import { useToastStore } from '~/stores/toast'
import { useI18n } from 'vue-i18n'

const configStore = useConfigStore()
const toastStore = useToastStore()
const { locale } = useI18n()

const saving = ref(false)
const importInput = ref<HTMLInputElement | null>(null)

// 本地设置状态
const settings = ref({
  defaultCompression: 'none',
  maxFileSize: 10,
  allowedTypes: 'jpg,jpeg,png,gif,webp,svg',
  autoCompress: false,
  copyAfterUpload: true,
  watermarkEnabled: false,
  watermarkText: '',
  watermarkPosition: 'bottom-right'
})

const theme = ref<'light' | 'dark' | 'auto'>('auto')

// 监听主题变化
watch(theme, (newTheme) => {
  applyTheme(newTheme)
  localStorage.setItem('theme', newTheme)
})

// 监听语言变化
watch(locale, (newLocale) => {
  localStorage.setItem('locale', newLocale)
})

// 应用主题
const applyTheme = (theme: 'light' | 'dark' | 'auto') => {
  const html = document.documentElement

  if (theme === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', prefersDark)
  } else {
    html.classList.toggle('dark', theme === 'dark')
  }
}

// 设置主题
const setTheme = (newTheme: 'light' | 'dark' | 'auto') => {
  theme.value = newTheme
}

// 加载设置
const loadSettings = async () => {
  try {
    // 从 localStorage 加载
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
    if (savedTheme) {
      theme.value = savedTheme
      applyTheme(savedTheme)
    }

    const savedLocale = localStorage.getItem('locale')
    if (savedLocale) {
      locale.value = savedLocale
    }

    const savedSettings = localStorage.getItem('userSettings')
    if (savedSettings) {
      settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
    }

    // 从配置 store 加载
    if (configStore.config) {
      if (configStore.config.watermarkText) {
        settings.value.watermarkText = configStore.config.watermarkText
      }
      if (configStore.config.imageCompression) {
        settings.value.defaultCompression = configStore.config.imageCompression
      }
      if (configStore.config.timestampDir !== undefined) {
        // timestampDir 对应 autoCompress 的反向逻辑，这里简化处理
      }
    }

    toastStore.success('设置加载成功')
  } catch (error) {
    toastStore.error('设置加载失败')
  }
}

// 保存设置
const saveSettings = async () => {
  saving.value = true

  try {
    // 保存到 localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings.value))
    localStorage.setItem('theme', theme.value)
    localStorage.setItem('locale', locale.value)

    // 同步到配置 store
    if (configStore.config) {
      configStore.config.watermarkText = settings.value.watermarkText
      configStore.config.imageCompression = settings.value.defaultCompression

      // 保存到服务器
      await configStore.saveConfig({
        ...configStore.config,
        watermarkText: settings.value.watermarkText,
        imageCompression: settings.value.defaultCompression
      })
    }

    toastStore.success('设置保存成功')
  } catch (error) {
    toastStore.error('设置保存失败')
  } finally {
    saving.value = false
  }
}

// 导出设置
const exportSettings = () => {
  const exportData = {
    settings: settings.value,
    theme: theme.value,
    locale: locale.value,
    exportDate: new Date().toISOString(),
    version: '2.0.0'
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `image-hosting-settings-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)

  toastStore.success('导出成功')
}

// 导入设置
const importSettings = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const file = target.files[0]
  const reader = new FileReader()

  reader.onload = async (e) => {
    try {
      const data = JSON.parse(e.target?.result as string)

      if (data.settings) {
        settings.value = { ...settings.value, ...data.settings }
      }
      if (data.theme) {
        theme.value = data.theme
        applyTheme(data.theme)
      }
      if (data.locale) {
        locale.value = data.locale
      }

      // 保存到 localStorage
      localStorage.setItem('userSettings', JSON.stringify(settings.value))
      localStorage.setItem('theme', theme.value)
      localStorage.setItem('locale', locale.value)

      toastStore.success('导入成功')
    } catch (error) {
      toastStore.error('导入失败')
    }
  }

  reader.readAsText(file)
  target.value = '' // Reset input
}

// 清除缓存
const clearCache = () => {
  if (confirm('确定要清除所有缓存数据吗？')) {
    localStorage.clear()
    sessionStorage.clear()

    // 重置设置
    settings.value = {
      defaultCompression: 'none',
      maxFileSize: 10,
      allowedTypes: 'jpg,jpeg,png,gif,webp,svg',
      autoCompress: false,
      copyAfterUpload: true,
      watermarkEnabled: false,
      watermarkText: '',
      watermarkPosition: 'bottom-right'
    }
    theme.value = 'auto'
    locale.value = 'zh-CN'

    toastStore.success('缓存已清除')
  }
}

// 重置设置
const resetSettings = () => {
  if (confirm('确定要重置所有设置并刷新页面吗？')) {
    clearCache()
    window.location.reload()
  }
}

// 初始化
onMounted(() => {
  loadSettings()
})
</script>
