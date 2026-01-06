<template>
  <div class="max-w-4xl mx-auto">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {{ $t('config.title') }}
      </h1>

      <!-- Repository Configuration -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('config.repository') }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.repositoryOwner') }}
            </label>
            <input
              v-model="config.repositoryOwner"
              type="text"
              :placeholder="authStore.user?.login || 'username'"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ $t('config.repositoryOwnerDesc') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.repositoryName') }}
            </label>
            <input
              v-model="config.repositoryName"
              type="text"
              placeholder="img.shenzjd.com"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.branch') }}
            </label>
            <input
              v-model="config.branch"
              type="text"
              placeholder="main"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.directory') }}
            </label>
            <input
              v-model="config.directory"
              type="text"
              placeholder="images"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ $t('config.directoryDesc') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Repository Actions -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('config.repositoryActions') }}
        </h2>

        <div class="flex flex-wrap gap-3">
          <button
            @click="checkRepository"
            :disabled="checkingRepo || !config.repositoryOwner || !config.repositoryName"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="checkingRepo" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ checkingRepo ? $t('config.checking') : $t('config.checkRepository') }}</span>
          </button>

          <button
            @click="createRepository"
            :disabled="creatingRepo || !config.repositoryOwner || !config.repositoryName"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="creatingRepo" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ creatingRepo ? $t('config.creating') : $t('config.createRepository') }}</span>
          </button>

          <button
            @click="initializeRepository"
            :disabled="initializingRepo || !config.repositoryOwner || !config.repositoryName || !config.branch"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg v-if="initializingRepo" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{{ initializingRepo ? $t('config.initializing') : $t('config.initializeRepository') }}</span>
          </button>
        </div>

        <div v-if="repoStatus" class="mt-3 p-3 rounded-lg text-sm" :class="repoStatus.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'">
          {{ repoStatus.message }}
        </div>
      </div>

      <!-- Advanced Settings -->
      <div class="mb-8">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ $t('config.advanced') }}
        </h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.customDomain') }}
            </label>
            <input
              v-model="config.customDomain"
              type="text"
              placeholder="https://cdn.example.com"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ $t('config.customDomainDesc') }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.watermarkText') }}
            </label>
            <input
              v-model="config.watermarkText"
              type="text"
              placeholder="© Your Name"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.imageCompression') }}
            </label>
            <select
              v-model="config.imageCompression"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="none">{{ $t('config.compressionNone') }}</option>
              <option value="light">{{ $t('config.compressionLight') }}</option>
              <option value="medium">{{ $t('config.compressionMedium') }}</option>
              <option value="heavy">{{ $t('config.compressionHeavy') }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ $t('config.timestampDir') }}
            </label>
            <div class="flex items-center">
              <input
                v-model="config.timestampDir"
                type="checkbox"
                class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {{ $t('config.timestampDirDesc') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Save Actions -->
      <div class="flex gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="saveConfig"
          :disabled="saving"
          class="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="saving" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{{ saving ? $t('config.saving') : $t('config.save') }}</span>
        </button>

        <button
          @click="resetConfig"
          class="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
        >
          {{ $t('config.reset') }}
        </button>

        <button
          @click="loadFromGitHub"
          :disabled="loadingGitHub"
          class="px-6 py-2.5 bg-blue-200 dark:bg-blue-900/30 hover:bg-blue-300 dark:hover:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg v-if="loadingGitHub" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>{{ loadingGitHub ? $t('config.loading') : $t('config.loadFromGitHub') }}</span>
        </button>
      </div>

      <!-- Repository Info -->
      <div v-if="repoInfo" class="mt-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-2">
          {{ $t('config.repositoryInfo') }}
        </h3>
        <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>{{ $t('config.repoFullName') }}: {{ repoInfo.full_name }}</div>
          <div>{{ $t('config.repoDescription') }}: {{ repoInfo.description || '-' }}</div>
          <div>{{ $t('config.repoDefaultBranch') }}: {{ repoInfo.default_branch }}</div>
          <div>{{ $t('config.repoPrivate') }}: {{ repoInfo.private ? $t('config.yes') : $t('config.no') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()

const config = ref({
  repositoryOwner: '',
  repositoryName: '',
  branch: '',
  directory: '',
  customDomain: '',
  watermarkText: '',
  imageCompression: 'none',
  timestampDir: false
})

const checkingRepo = ref(false)
const creatingRepo = ref(false)
const initializingRepo = ref(false)
const saving = ref(false)
const loadingGitHub = ref(false)

const repoStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)
const repoInfo = ref<any>(null)

// 加载现有配置
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await configStore.loadConfig()
      if (configStore.config) {
        config.value = { ...configStore.config }
      } else {
        // 设置默认值
        config.value.repositoryOwner = authStore.user?.login || ''
        config.value.repositoryName = 'img.shenzjd.com'
        config.value.branch = 'main'
        config.value.directory = 'images'
      }
    } catch (error) {
      toastStore.error('加载配置失败')
    }
  }
})

// 检查仓库是否存在
const checkRepository = async () => {
  checkingRepo.value = true
  repoStatus.value = null
  repoInfo.value = null

  try {
    const response = await $fetch('/api/repo/list', {
      headers: useRequestHeaders(['cookie'])
    })

    const repo = response.find(
      (r: any) =>
        r.name === config.value.repositoryName &&
        r.owner.login === config.value.repositoryOwner
    )

    if (repo) {
      repoStatus.value = {
        type: 'success',
        message: '✅ ' + $t('config.repoExists')
      }
      repoInfo.value = repo
    } else {
      repoStatus.value = {
        type: 'error',
        message: '❌ ' + $t('config.repoNotExists')
      }
    }
  } catch (error: any) {
    repoStatus.value = {
      type: 'error',
      message: '❌ ' + (error.message || $t('config.checkFailed'))
    }
  } finally {
    checkingRepo.value = false
  }
}

// 创建仓库
const createRepository = async () => {
  creatingRepo.value = true
  repoStatus.value = null

  try {
    const response = await $fetch('/api/repo/create', {
      method: 'POST',
      body: {
        name: config.value.repositoryName,
        private: false,
        autoInit: false
      },
      headers: useRequestHeaders(['cookie'])
    })

    repoStatus.value = {
      type: 'success',
      message: '✅ ' + $t('config.createSuccess')
    }
    repoInfo.value = response
    toastStore.success($t('config.createSuccess'))
  } catch (error: any) {
    repoStatus.value = {
      type: 'error',
      message: '❌ ' + (error.message || $t('config.createFailed'))
    }
    toastStore.error($t('config.createFailed'))
  } finally {
    creatingRepo.value = false
  }
}

// 初始化仓库（创建 README 和 .gitignore）
const initializeRepository = async () => {
  initializingRepo.value = true
  repoStatus.value = null

  try {
    await $fetch('/api/repo/init', {
      method: 'POST',
      body: {
        owner: config.value.repositoryOwner,
        name: config.value.repositoryName,
        branch: config.value.branch
      },
      headers: useRequestHeaders(['cookie'])
    })

    repoStatus.value = {
      type: 'success',
      message: '✅ ' + $t('config.initSuccess')
    }
    toastStore.success($t('config.initSuccess'))
  } catch (error: any) {
    repoStatus.value = {
      type: 'error',
      message: '❌ ' + (error.message || $t('config.initFailed'))
    }
    toastStore.error($t('config.initFailed'))
  } finally {
    initializingRepo.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName || !config.value.branch || !config.value.directory) {
    toastStore.error($t('config.fillAllRequired'))
    return
  }

  saving.value = true
  try {
    await configStore.saveConfig({
      repositoryOwner: config.value.repositoryOwner,
      repositoryName: config.value.repositoryName,
      branch: config.value.branch,
      directory: config.value.directory,
      customDomain: config.value.customDomain,
      watermarkText: config.value.watermarkText,
      imageCompression: config.value.imageCompression,
      timestampDir: config.value.timestampDir
    })
    toastStore.success($t('config.saveSuccess'))
  } catch (error) {
    toastStore.error($t('config.saveFailed'))
  } finally {
    saving.value = false
  }
}

// 重置配置
const resetConfig = () => {
  config.value = {
    repositoryOwner: authStore.user?.login || '',
    repositoryName: 'img.shenzjd.com',
    branch: 'main',
    directory: 'images',
    customDomain: '',
    watermarkText: '',
    imageCompression: 'none',
    timestampDir: false
  }
  repoStatus.value = null
  repoInfo.value = null
  toastStore.info($t('config.resetInfo'))
}

// 从 GitHub 加载配置
const loadFromGitHub = async () => {
  if (!config.value.repositoryOwner || !config.value.repositoryName) {
    toastStore.error($t('config.fillRepoFirst'))
    return
  }

  loadingGitHub.value = true
  try {
    const response = await $fetch('/api/repo/contents', {
      query: {
        owner: config.value.repositoryOwner,
        name: config.value.repositoryName,
        path: '',
        ref: config.value.branch || 'main'
      },
      headers: useRequestHeaders(['cookie'])
    })

    // 检查是否有 .imgconfig.json 文件
    const configFile = response.find((f: any) => f.name === '.imgconfig.json')
    if (configFile) {
      const configData = await $fetch(configFile.download_url, {
        headers: useRequestHeaders(['cookie'])
      })

      if (configData) {
        const parsed = JSON.parse(configData)
        config.value = { ...config.value, ...parsed }
        toastStore.success($t('config.loadSuccess'))
      }
    } else {
      toastStore.info($t('config.noConfigFile'))
    }
  } catch (error) {
    toastStore.error($t('config.loadFailed'))
  } finally {
    loadingGitHub.value = false
  }
}
</script>
