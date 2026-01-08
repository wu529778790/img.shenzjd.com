import { defineStore } from 'pinia'
import { apiFetch } from '~/utils/api-fetch'

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
      // 使用 useFetch 确保请求携带 cookie
      const { data, error } = await useFetch('/api/auth/verify', {
        method: 'GET'
      })

      if (error.value) {
        // 如果是 401 错误，说明未登录，这是正常情况
        if (error.value.statusCode !== 401) {
          console.error('Auth init error:', error.value)
        }
        this.clearAuth()
        return
      }

      if (data.value && data.value.valid) {
        this.user = data.value.user
        this.isAuthenticated = true
      } else {
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
        const response = await apiFetch('/api/auth/verify', {
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
        await apiFetch('/api/auth/logout', {
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
      // 注意：httpOnly cookie 无法通过客户端 JavaScript 清除
      // 需要通过服务端 API 清除
    }
  }
})
