<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IMG</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ $t('app.title') }}
          </h1>
        </div>

        <!-- User Menu -->
        <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
          <span class="text-sm text-gray-700 dark:text-gray-300">
            {{ authStore.user?.login }}
          </span>
          <button
            @click="handleLogout"
            class="px-3 py-1.5 text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-md transition-colors"
          >
            {{ $t('auth.logout') }}
          </button>
        </div>
      </div>
    </header>

    <!-- Navigation -->
    <Navigation />

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <NuxtPage />
    </main>

    <!-- Toast Notifications -->
    <div class="fixed bottom-4 right-4 space-y-2 z-50">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="px-4 py-3 rounded-lg shadow-lg min-w-[300px] flex items-center justify-between"
        :class="{
          'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-300': toast.type === 'success',
          'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300': toast.type === 'error',
          'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': toast.type === 'info',
          'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300': toast.type === 'warning'
        }"
      >
        <span>{{ toast.message }}</span>
        <button @click="toastStore.removeToast(toast.id)" class="ml-2 text-sm opacity-70 hover:opacity-100">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const toastStore = useToastStore()

const handleLogout = async () => {
  try {
    await authStore.logout()
    await navigateTo('/login')
    toastStore.success('已退出登录')
  } catch (error) {
    toastStore.error('退出登录失败')
  }
}
</script>

<style>
:root {
  --primary: #4975c6;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
}

/* Element Plus Dark Mode Override */
.dark .el-button--primary {
  --el-button-bg-color: var(--primary);
  --el-button-border-color: var(--primary);
  --el-button-hover-bg-color: #385a9a;
  --el-button-hover-border-color: #385a9a;
}
</style>
