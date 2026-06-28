'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, token } = useAuthStore()

  useEffect(() => {
    // 如果是登录页，不需要认证
    if (pathname.startsWith('/login')) {
      return
    }

    // 如果没有认证，跳转到登录页
    if (!isAuthenticated || !token) {
      router.push('/login')
    }
  }, [isAuthenticated, token, pathname, router])

  return <>{children}</>
}
