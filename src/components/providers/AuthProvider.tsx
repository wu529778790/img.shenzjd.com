'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // 不再强制重定向，让所有页面都可访问
    // 认证检查在各个功能页面中自行处理
  }, [pathname])

  return <>{children}</>
}
