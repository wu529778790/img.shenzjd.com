import { defineStore } from 'pinia'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

export interface ToastState {
  toasts: Toast[]
}

export const useToastStore = defineStore('toast', {
  state: (): ToastState => ({
    toasts: []
  }),

  actions: {
    /**
     * 添加通知
     */
    addToast(message: string, type: Toast['type'] = 'info', duration = 3000) {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const toast: Toast = { id, message, type, duration }

      this.toasts.push(toast)

      // 自动移除
      setTimeout(() => {
        this.removeToast(id)
      }, duration)

      return id
    },

    /**
     * 移除通知
     */
    removeToast(id: string) {
      this.toasts = this.toasts.filter(t => t.id !== id)
    },

    /**
     * 快捷方法
     */
    success(message: string, duration?: number) {
      return this.addToast(message, 'success', duration)
    },

    error(message: string, duration?: number) {
      return this.addToast(message, 'error', duration)
    },

    warning(message: string, duration?: number) {
      return this.addToast(message, 'warning', duration)
    },

    info(message: string, duration?: number) {
      return this.addToast(message, 'info', duration)
    }
  }
})
