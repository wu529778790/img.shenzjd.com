'use client'

import { useEffect } from 'react'

/**
 * 主题始终跟随系统（prefers-color-scheme），不提供手动切换。
 * 挂载时应用一次，并响应系统外观变化。
 */
export function ThemeProvider() {
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (dark: boolean) => {
      root.classList.remove('light', 'dark')
      root.classList.add(dark ? 'dark' : 'light')
    }
    apply(mq.matches)
    const handler = (e: MediaQueryListEvent) => apply(e.matches)
    mq.addEventListener('change', handler)
    // 清理历史版本持久化的手动主题选择
    localStorage.removeItem('theme-storage')
    return () => mq.removeEventListener('change', handler)
  }, [])

  return null
}
