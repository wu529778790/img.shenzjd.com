<template>
  <nav v-if="authStore.isAuthenticated" class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <!-- Desktop Navigation -->
        <div class="hidden md:flex md:items-center md:space-x-4">
          <NuxtLink
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
            :class="[
              $route.path === item.path
                ? 'bg-primary-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            ]"
          >
            {{ item.label }}
          </NuxtLink>
        </div>

        <!-- Mobile Navigation -->
        <div class="md:hidden flex items-center">
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                v-if="!mobileMenuOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Right Side -->
        <div class="hidden md:flex md:items-center md:space-x-2">
          <button
            @click="toggleTheme"
            class="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'"
          >
            <svg v-if="theme === 'dark'" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-700">
      <div class="px-2 pt-2 pb-3 space-y-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="block px-3 py-2 rounded-md text-base font-medium"
          :class="[
            $route.path === item.path
              ? 'bg-primary-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]"
          @click="mobileMenuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
        <button
          @click="toggleTheme"
          class="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {{ theme === 'dark' ? '切换到亮色' : '切换到暗色' }}
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()
const mobileMenuOpen = ref(false)

// Theme management
const theme = ref<'light' | 'dark' | 'auto'>('auto')

const toggleTheme = () => {
  const html = document.documentElement
  const currentDark = html.classList.contains('dark')

  if (currentDark) {
    html.classList.remove('dark')
    theme.value = 'light'
    localStorage.setItem('theme', 'light')
  } else {
    html.classList.add('dark')
    theme.value = 'dark'
    localStorage.setItem('theme', 'dark')
  }
}

// Navigation items
const navItems = computed(() => [
  { path: '/', label: '🏠 首页' },
  { path: '/upload', label: '📤 上传' },
  { path: '/manage', label: '📁 管理' },
  { path: '/config', label: '⚙️ 配置' },
  { path: '/tools', label: '🔧 工具箱' },
  { path: '/settings', label: '🎯 设置' }
])

// Initialize theme
onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto'
  if (savedTheme) {
    theme.value = savedTheme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else if (savedTheme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        document.documentElement.classList.add('dark')
      }
    }
  }
})
</script>
