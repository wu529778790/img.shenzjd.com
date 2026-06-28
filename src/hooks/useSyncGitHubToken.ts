'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * 监听登录状态，自动将 GitHub token 同步到 localStorage
 * 这样其他不需要 session 的 hook（如 useConfigSync）也能使用 token
 */
export function SyncGitHubTokenToLocalStorage() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.accessToken) {
      localStorage.setItem('github_token', session.accessToken)
    } else {
      // 未登录时清除 token
      localStorage.removeItem('github_token')
    }
  }, [session?.accessToken])

  return null
}
