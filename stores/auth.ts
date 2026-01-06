import { defineStore } from 'pinia'

export interface User {
  id: number
  login: string
  email: string
  avatarUrl: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    getIsAuthenticated: (state) => state.isAuthenticated,
    getLoading: (state) => state.loading
  },

  actions: {
    /**
     * 初始化认证状态（从 Cookie 恢复）
     */
    async initAuth() {
      const { $fetch } = useNuxtApp()

      // 检查是否存在 auth_token cookie
      const cookie = useCookie('auth_token')
      if (!cookie.value) {
        this.clearAuth()
        return
      }

      try {
        // 验证 token
        const response = await $fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${cookie.value}`
          }
        })

        if (response.valid) {
          this.user = response.user
          this.token = cookie.value
          this.isAuthenticated = true
        }
      } catch (error) {
        console.error('Auth init error:', error)
        this.clearAuth()
      }
    },

    /**
     * 开始 GitHub 登录流程
     */
    async loginWithGitHub() {
      // 重定向到 GitHub OAuth 授权页面
      window.location.href = '/api/auth/github'
    },

    /**
     * 验证当前 token
     */
    async verifyAuth() {
      if (!this.token) {
        return false
      }

      try {
        const { $fetch } = useNuxtApp()
        const response = await $fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${this.token}`
          }
        })

        if (response.valid) {
          this.user = response.user
          this.isAuthenticated = true
          return true
        }
      } catch (error) {
        this.clearAuth()
      }

      return false
    },

    /**
     * 退出登录
     */
    async logout() {
      try {
        const { $fetch } = useNuxtApp()
        await $fetch('/api/auth/logout', {
          method: 'POST'
        })
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.clearAuth()
      }
    },

    /**
     * 清除认证状态
     */
    clearAuth() {
      this.user = null
      this.token = null
      this.isAuthenticated = false

      // 清除 cookie
      const cookie = useCookie('auth_token')
      cookie.value = null
    },

    /**
     * 设置 token（用于回调处理）
     */
    setToken(token: string) {
      this.token = token
      const cookie = useCookie('auth_token')
      cookie.value = token
    }
  }
})
