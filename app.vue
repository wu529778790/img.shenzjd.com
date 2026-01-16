<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
    <!-- Top Navigation -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center space-x-4">
            <NuxtLink to="/" class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">IMG</span>
              </div>
              <span class="text-lg font-bold text-gray-900 dark:text-white hidden sm:inline">图床应用</span>
            </NuxtLink>
          </div>

          <!-- Desktop Navigation -->
          <nav v-if="authStore.isAuthenticated" class="hidden md:flex items-center space-x-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === item.path || ($route.path === '/' && item.path === '/')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            <div v-if="authStore.isAuthenticated" class="flex items-center space-x-3">
              <img 
                v-if="authStore.user?.avatarUrl" 
                :src="authStore.user.avatarUrl" 
                :alt="authStore.user.login" 
                class="w-8 h-8 rounded-full object-cover hidden sm:block"
              />
              <span class="text-sm font-medium text-gray-900 dark:text-white hidden sm:inline">
                {{ authStore.user?.login }}
              </span>
              <button
                @click="handleLogout"
                class="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                退出
              </button>
            </div>
            <button
              v-else
              @click="showLoginModal = true"
              class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              登录
            </button>
          </div>

          <!-- Mobile Menu Button -->
          <button
            v-if="authStore.isAuthenticated"
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path v-if="!mobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Mobile Navigation -->
        <div v-if="mobileMenuOpen && authStore.isAuthenticated" class="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
          <nav class="flex flex-col space-y-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              @click="mobileMenuOpen = false"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              :class="[
                $route.path === item.path || ($route.path === '/' && item.path === '/')
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <NuxtPage />
    </main>

    <!-- Login Modal -->
    <LoginModal v-model:visible="showLoginModal" />

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
import { onMounted, computed, ref } from 'vue'

const authStore = useAuthStore()
const toastStore = useToastStore()
const showLoginModal = ref(false)
const mobileMenuOpen = ref(false)

// Navigation items - 简化后的导航
const navItems = computed(() => [
  { path: '/', label: '首页' },
  { path: '/manage', label: '管理' },
  { path: '/settings', label: '设置' }
])

// 初始化认证状态（从 Cookie 恢复）
onMounted(async () => {
  await authStore.initAuth()
})

const handleLogout = async () => {
  try {
    await authStore.logout()
    toastStore.success('已退出登录')
    await navigateTo('/')
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
