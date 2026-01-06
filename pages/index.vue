<template>
  <div class="max-w-7xl mx-auto">
    <!-- Hero Section -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6 border border-gray-200 dark:border-gray-700">
      <div class="flex flex-col md:flex-row items-center justify-between gap-8">
        <div class="flex-1">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {{ $t('home.welcome') }}
          </h1>
          <p class="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {{ $t('home.description') }}
          </p>
          <div class="flex gap-3">
            <NuxtLink to="/upload">
              <button class="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                {{ $t('nav.upload') }}
              </button>
            </NuxtLink>
            <NuxtLink to="/config">
              <button class="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                {{ $t('nav.config') }}
              </button>
            </NuxtLink>
          </div>
        </div>
        <div class="flex-shrink-0">
          <div class="w-24 h-24 bg-primary-600 rounded-2xl flex items-center justify-center">
            <span class="text-white font-bold text-3xl">IMG</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('home.currentRepo') }}
        </div>
        <div class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ configStore.config?.repository || $t('home.notConfigured') }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1" v-if="configStore.config?.branch">
          {{ configStore.config.branch }}
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('home.storagePath') }}
        </div>
        <div class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ configStore.config?.directory || $t('home.notConfigured') }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ $t('home.configurable') }}
        </div>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('home.user') }}
        </div>
        <div class="text-xl font-semibold text-gray-900 dark:text-white">
          {{ authStore.user?.login || '-' }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ authStore.user?.name || '' }}
        </div>
      </div>
    </div>

    <!-- Features -->
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {{ $t('home.features') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature1Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature1Desc') }}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature2Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature2Desc') }}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature3Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature3Desc') }}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature4Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature4Desc') }}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature5Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature5Desc') }}
            </p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white mb-1">
              {{ $t('home.feature6Title') }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ $t('home.feature6Desc') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700" v-if="!configStore.config?.repository">
      <div class="flex items-center gap-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div class="flex-1">
          <h3 class="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
            {{ $t('home.setupRequired') }}
          </h3>
          <p class="text-sm text-yellow-700 dark:text-yellow-300">
            {{ $t('home.setupRequiredDesc') }}
          </p>
        </div>
        <NuxtLink to="/config">
          <button class="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            {{ $t('home.goToConfig') }}
          </button>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const configStore = useConfigStore()
const toastStore = useToastStore()

// 检查是否已配置仓库
onMounted(async () => {
  if (authStore.isAuthenticated) {
    try {
      await configStore.loadConfig()
    } catch (error) {
      toastStore.error('加载配置失败')
    }
  }
})
</script>
