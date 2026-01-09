<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
    <!-- Sidebar Navigation - Desktop -->
    <aside 
      v-if="authStore.isAuthenticated" 
      class="hidden md:flex flex-col w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <!-- Logo and User Info -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">IMG</span>
          </div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white">
            图床应用
          </h1>
        </div>
        <div class="mt-4 flex items-center space-x-3">
          <img 
            v-if="authStore.user?.avatarUrl" 
            :src="authStore.user.avatarUrl" 
            :alt="authStore.user.login" 
            class="w-8 h-8 rounded-full object-cover"
          />
          <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ authStore.user?.login }}
          </span>
        </div>
      </div>

      <!-- Navigation Menu -->
      <nav class="flex-1 p-2 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1"
          :class="[
            $route.path === item.path
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
        >
          <span>{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Logout Button -->
      <div class="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="handleLogout"
          class="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span>🚪</span>
          <span>退出登录</span>
        </button>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header - Mobile -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 md:hidden">
        <div class="p-4 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">IMG</span>
            </div>
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">
              图床应用
            </h1>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ authStore.user?.login }}
          </span>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
        <NuxtPage />
      </main>

      <!-- Bottom Navigation - Mobile -->
      <nav 
        v-if="authStore.isAuthenticated" 
        class="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 fixed bottom-0 left-0 right-0 z-50"
      >
        <div class="flex justify-around items-center h-16">
          <NuxtLink
            v-for="item in mobileNavItems"
            :key="item.path"
            :to="item.path"
            class="flex flex-col items-center justify-center space-y-1 p-2 text-sm transition-colors"
            :class="[
              $route.path === item.path
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
            ]"
          >
            <span class="text-lg">{{ item.icon }}</span>
            <span class="text-xs font-medium">{{ item.label }}</span>
          </NuxtLink>
        </div>
      </nav>
    </div>

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
import { onMounted, computed } from 'vue'

const authStore = useAuthStore()
const toastStore = useToastStore()

// Navigation items
const navItems = computed(() => [
  { path: '/', icon: '🏠', label: '首页' },
  { path: '/upload', icon: '📤', label: '上传' },
  { path: '/manage', icon: '📁', label: '管理' },
  { path: '/config', icon: '⚙️', label: '配置' },
  { path: '/tools', icon: '🔧', label: '工具箱' },
  { path: '/settings', icon: '🎯', label: '设置' }
])

// Mobile navigation items (show only most important)
const mobileNavItems = computed(() => [
  { path: '/upload', icon: '📤', label: '上传' },
  { path: '/manage', icon: '📁', label: '管理' },
  { path: '/config', icon: '⚙️', label: '配置' },
  { path: '/settings', icon: '🎯', label: '设置' }
])

// 初始化认证状态（从 Cookie 恢复）
onMounted(async () => {
  await authStore.initAuth()
})

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
