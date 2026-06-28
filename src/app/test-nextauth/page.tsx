'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function NextAuthTestPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">NextAuth 测试页面</h1>

      <div className="space-y-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded">
          <h2 className="font-semibold mb-2">Session 状态</h2>
          <pre className="text-sm">
            {JSON.stringify({ status, hasSession: !!session, user: session?.user }, null, 2)}
          </pre>
        </div>

        {!session ? (
          <button
            onClick={() => signIn('github')}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            登录
          </button>
        ) : (
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-500 text-white rounded"
          >
            退出
          </button>
        )}
      </div>
    </div>
  )
}
