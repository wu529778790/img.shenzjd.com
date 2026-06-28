'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'

export default function TokenLoginPage() {
  const router = useRouter()
  const [token, setToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token.trim()) {
      toast.error('请输入 Token')
      return
    }

    try {
      const result = await signIn('credentials', {
        token,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      toast.success('登录成功')
      router.push('/upload')
      router.refresh()
    } catch (error) {
      toast.error('Token 无效，请检查')
      console.error('Token validation failed:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Key className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="text-2xl font-bold mt-4">使用 Token 登录</h1>
          <p className="text-gray-500 mt-2 text-sm">
            请输入您的 GitHub Personal Access Token
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="token">Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxx"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-2">
              前往 GitHub Settings → Developer settings → Personal access tokens 生成
            </p>
          </div>

          <Button type="submit" className="w-full">
            登录
          </Button>

          <Button
            type="button"
            onClick={() => router.back()}
            className="w-full"
            variant="ghost"
          >
            返回
          </Button>
        </form>
      </Card>
    </div>
  )
}
