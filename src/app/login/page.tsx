'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'

export default function LoginPage() {
  const router = useRouter()
  const loginWithOAuth = useAuthStore((state) => state.loginWithOAuth)

  // 检查是否配置了 GitHub OAuth
  const [hasGitHubOAuth, setHasGitHubOAuth] = useState(false)

  useEffect(() => {
    // 检查 OAuth 配置（需要在客户端执行）
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
    setHasGitHubOAuth(Boolean(clientId))

    // 检查 URL 中是否有 token（OAuth 回调）
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const user = params.get('user')
    const error = params.get('error')

    if (error) {
      console.error('OAuth error:', error)
      // TODO: 显示错误提示
    }

    if (token && user) {
      // OAuth 登录成功，保存到 store
      const userData = JSON.parse(decodeURIComponent(user))
      loginWithOAuth(token, userData)

      // 清空 URL 参数
      window.history.replaceState({}, '', '/login')
      // 跳转到上传页
      router.push('/upload')
    }
  }, [router, loginWithOAuth])

  const handleGitHubLogin = async () => {
    try {
      const response = await fetch('/api/auth/login')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'GitHub OAuth 未配置')
      }

      window.location.href = data.url
    } catch (error) {
      console.error('GitHub login error:', error)
      // TODO: 显示错误提示
      alert(error instanceof Error ? error.message : 'GitHub OAuth 未配置，请使用 Token 登录')
    }
  }

  const handleTokenLogin = () => {
    router.push('/login/token')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">ImgX</h1>
          <p className="text-gray-500 mt-2">个人图床管理工具</p>
        </div>

        <div className="space-y-4">
          {hasGitHubOAuth && (
            <Button
              onClick={handleGitHubLogin}
              className="w-full"
              variant="outline"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              使用 GitHub 登录
            </Button>
          )}

          {!hasGitHubOAuth && (
            <div className="text-center text-sm text-gray-500 dark:text-gray-400 p-4 rounded-lg border border-dashed">
              💡 GitHub OAuth 未配置，请使用 Token 登录
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-500">
                或
              </span>
            </div>
          </div>

          <Button
            onClick={handleTokenLogin}
            className="w-full"
            variant="secondary"
          >
            <Key className="mr-2 h-5 w-5" />
            使用 Token 登录
          </Button>
        </div>
      </Card>
    </div>
  )
}
