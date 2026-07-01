'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/hooks/useTheme'

/**
 * 主题初始化和系统主题变化监听。
 *
 * 修复问题:
 * 1. 页面加载时 Zustand store 里的 theme 不会自动写到 <html class>,
 *    导致首次加载不跟随系统。
 * 2. 设置为「跟随系统」后,切换 OS 外观时页面不会响应式变化。
 */
export function ThemeProvider() {
  // 订阅 theme 变化,以便在用户切换时重建监听器
  const theme = useThemeStore((s) => s.theme)

  // 初始化:页面挂载时立即把当前(或持久化的)主题应用到 <html>
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    if (theme === 'system') {
      const system = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(system)
    } else {
      root.classList.add(theme)
    }
    // 只在挂载时跑一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 监听系统主题变化:仅当用户选择"跟随系统"时生效
  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      root.classList.add(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return null
}
