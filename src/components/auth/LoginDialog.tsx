'use client'

import { useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'

interface LoginDialogProps {
  title?: string
  description?: string
}

export function LoginDialog({ title, description }: LoginDialogProps) {
  const handleGitHubLogin = useCallback(() => {
    signIn('github', { callbackUrl: '/' })
  }, [])

  return (
    <Card className="w-full max-w-md p-8">
      {/* 图标 */}
      <div className="flex justify-center mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"
        >
          <GitBranch className="h-8 w-8 text-gray-700 dark:text-gray-300" />
        </motion.div>
      </div>

      {/* 标题 */}
      {title && (
        <div className="text-center mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
        </div>
      )}

      {/* 描述 */}
      {description && (
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          {description}
        </p>
      )}

      {/* 登录按钮 */}
      <div className="space-y-4">
        <Button
          onClick={handleGitHubLogin}
          className="w-full gap-2 font-semibold"
          variant="gradient"
          size="lg"
        >
          <GitBranch className="h-5 w-5" />
          使用 GitHub 登录
        </Button>
      </div>
    </Card>
  )
}
