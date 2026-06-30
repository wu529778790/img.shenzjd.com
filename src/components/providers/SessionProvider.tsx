'use client'

console.log('[APP] SessionProvider mounting')

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

/**
 * Auth Provider - 配置会话管理策略
 *
 * 配置说明：
 * - refetchInterval: 0 = 不自动轮询（推荐生产环境）
 * - refetchOnWindowFocus: false = 窗口聚焦时不自动刷新
 * - refetchWhenOffline: false = 离线时不请求
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
