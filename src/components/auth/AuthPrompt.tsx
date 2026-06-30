'use client'

import { useAuthDialog } from '@/components/auth/AuthDialogProvider'
import { Lock, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardAnimation } from '@/components/animations/PageAnimations'
import { useFramerMotion } from '@/hooks/useFramerMotion'

export type AuthPromptMode = 'login' | 'config'

export interface AuthPromptProps {
  mode: AuthPromptMode
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
}

export function AuthPrompt({
  mode,
  title,
  description,
  buttonText,
  onButtonClick,
  className,
}: AuthPromptProps) {
  const { openLoginDialog } = useAuthDialog()
  const Framer = useFramerMotion()
  const motion = Framer?.motion
  const MotionDiv = motion?.div

  const config = {
    login: {
      icon: Lock,
      defaultTitle: '需要登录',
      defaultDescription: '登录后才能继续操作',
      defaultButtonText: '立即登录',
    },
    config: {
      icon: FolderTree,
      defaultTitle: '请先配置图床',
      defaultDescription: '在开始之前，需要先配置您的 GitHub 仓库',
      defaultButtonText: '去配置',
    },
  }[mode]

  const Icon = config.icon

  const handleButtonClick = () => {
    if (onButtonClick) {
      onButtonClick()
    } else if (mode === 'login') {
      openLoginDialog()
    } else {
      window.location.href = '/config'
    }
  }

  const iconEl = (
    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-violet-600/10 dark:from-indigo-400/20 dark:to-violet-500/20 flex items-center justify-center mb-6">
      <Icon className="h-10 w-10 text-primary" />
    </div>
  )

  return (
    <CardAnimation className={className} delay={0.1}>
      <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200/70 dark:border-gray-700/50 shadow-modern-lg backdrop-blur-sm">
        <div className="flex justify-center mb-6">
          {MotionDiv ? (
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            >
              {iconEl}
            </MotionDiv>
          ) : (
            iconEl
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
          {title || config.defaultTitle}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {description || config.defaultDescription}
        </p>

        {MotionDiv ? (
          <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleButtonClick} size="lg" variant="gradient" className="w-full">
              {buttonText || config.defaultButtonText}
            </Button>
          </MotionDiv>
        ) : (
          <Button onClick={handleButtonClick} size="lg" variant="gradient" className="w-full">
            {buttonText || config.defaultButtonText}
          </Button>
        )}
      </div>
    </CardAnimation>
  )
}
