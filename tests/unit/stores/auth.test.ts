import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '~/stores/auth'

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    // 创建新的pinia实例
    const pinia = createPinia()
    setActivePinia(pinia)
    // 创建auth store实例
    authStore = useAuthStore()
  })

  it('should initialize with default state', () => {
    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })

  it('should clear user and token on logout', () => {
    // 手动设置用户和token
    authStore.$state.user = {
      id: 1,
      login: 'testuser',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    authStore.$state.token = 'test-token'
    authStore.$state.isAuthenticated = true

    // 然后登出
    authStore.logout()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })

  it('should clear auth state', () => {
    // 手动设置用户和token
    authStore.$state.user = {
      id: 1,
      login: 'testuser',
      email: 'test@example.com',
      avatarUrl: 'https://example.com/avatar.jpg',
    }
    authStore.$state.token = 'test-token'
    authStore.$state.isAuthenticated = true

    // 清除认证状态
    authStore.clearAuth()

    expect(authStore.isAuthenticated).toBe(false)
    expect(authStore.user).toBeNull()
    expect(authStore.token).toBeNull()
  })
})
