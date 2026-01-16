<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="handleClose"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700"
          @click.stop
        >
          <!-- Header -->
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-primary-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <span class="text-white font-bold text-2xl">IMG</span>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              登录
            </h2>
            <p class="text-gray-600 dark:text-gray-400">
              使用 GitHub 账号登录
            </p>
          </div>

          <!-- Login Button -->
          <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>{{ loading ? '登录中...' : '使用 GitHub 登录' }}</span>
          </button>

          <!-- Info -->
          <div class="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
            <p>我们不会存储您的密码，仅使用 GitHub OAuth 进行认证。</p>
          </div>

          <!-- Close Button -->
          <button
            @click="handleClose"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useToastStore } from '~/stores/toast'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const authStore = useAuthStore()
const toastStore = useToastStore()
const loading = ref(false)
let oauthWindow: Window | null = null
let checkInterval: NodeJS.Timeout | null = null

const handleClose = () => {
  emit('update:visible', false)
  if (oauthWindow) {
    oauthWindow.close()
    oauthWindow = null
  }
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

const handleLogin = async () => {
  loading.value = true
  
  try {
    // 打开 OAuth 弹窗
    const width = 600
    const height = 700
    const left = window.screen.width / 2 - width / 2
    const top = window.screen.height / 2 - height / 2
    
    oauthWindow = window.open(
      '/api/auth/github?popup=true',
      'GitHub OAuth',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    )

    if (!oauthWindow) {
      toastStore.error('无法打开登录窗口，请检查浏览器弹窗设置')
      loading.value = false
      return
    }

    // 监听弹窗关闭
    checkInterval = setInterval(() => {
      if (oauthWindow?.closed) {
        clearInterval(checkInterval!)
        checkInterval = null
        loading.value = false
        // 检查认证状态
        authStore.initAuth()
      }
    }, 500)

    // 监听来自回调页面的消息
    const messageHandler = (event: MessageEvent) => {
      // 验证消息来源（生产环境应该验证 origin）
      if (event.data?.type === 'oauth-callback') {
        if (event.data.success) {
          authStore.initAuth().then(() => {
            toastStore.success('登录成功')
            handleClose()
          })
        } else {
          toastStore.error(event.data.error || '登录失败')
        }
        loading.value = false
        if (oauthWindow) {
          oauthWindow.close()
          oauthWindow = null
        }
        window.removeEventListener('message', messageHandler)
      }
    }

    window.addEventListener('message', messageHandler)

    // 清理监听器（当组件卸载或弹窗关闭时）
    const cleanup = () => {
      window.removeEventListener('message', messageHandler)
      if (checkInterval) {
        clearInterval(checkInterval)
        checkInterval = null
      }
    }

    onUnmounted(cleanup)
  } catch (error) {
    toastStore.error('登录失败')
    loading.value = false
  }
}

// ESC 键关闭
onMounted(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.visible) {
      handleClose()
    }
  }
  window.addEventListener('keydown', handleEsc)
  onUnmounted(() => {
    window.removeEventListener('keydown', handleEsc)
  })
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.9);
  opacity: 0;
}
</style>