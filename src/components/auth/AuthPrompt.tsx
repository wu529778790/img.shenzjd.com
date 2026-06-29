'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardAnimation } from '@/components/animations/PageAnimations'
import { motion } from 'framer-motion'

export type AuthPromptMode = 'login' | 'config'

export interface AuthPromptProps {
  /** 引导类型：login = 登录引导, config = 配置引导 */
  mode: AuthPromptMode
  /** 自定义标题 */
  title?: string
  /** 自定义描述 */
  description?: string
  /** 自定义按钮文本 */
  buttonText?: string
  /** 按钮点击事件 */
  onButtonClick?: () => void
  /** 自定义类名 */
  className?: string
}

/**
 * 统一的认证引导组件
 *
 * 用于在用户未登录或未配置时显示引导卡片
 * 确保整个应用的引导体验一致
 *
 * @example
 * // 未登录引导
 * <AuthPrompt
 *   mode="login"
 *   description="登录后才能管理图片"
 *   buttonText="立即登录"
 *   onButtonClick={() => router.push('/login')}
 * />
 *
 * @example
 * // 未配置引导
 * <AuthPrompt
 *   mode="config"
 *   description="在开始之前，需要先配置您的 GitHub 仓库"
 *   buttonText="去配置"
 *   onButtonClick={() => router.push('/config')}
 * />
 */
export function AuthPrompt({
  mode,
  title,
  description,
  buttonText,
  onButtonClick,
  className,
}: AuthPromptProps) {
  const router = useRouter()

  // 默认配置
  const config = {
    login: {
      icon: Lock,
      defaultTitle: '需要登录',
      defaultDescription: '登录后才能继续操作',
      defaultButtonText: '立即登录',
      defaultAction: () => router.push('/login'),
    },
    config: {
      icon: FolderTree,
      defaultTitle: '请先配置图床',
      defaultDescription: '在开始之前，需要先配置您的 GitHub 仓库',
      defaultButtonText: '去配置',
      defaultAction: () => router.push('/config'),
    },
  }[mode]

  const Icon = config.icon
  const handleClick = onButtonClick || config.defaultAction

  return (
    <CardAnimation className={className} delay={0.1}>
      <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* 图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6"
        >
          <Icon className="h-10 w-10 text-primary" />
        </motion.div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
          {title || config.defaultTitle}
        </h2>

        {/* 描述 */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {description || config.defaultDescription}
        </p>

        {/* 按钮 */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleClick} size="lg" className="w-full">
            {buttonText || config.defaultButtonText}
          </Button>
        </motion.div>
      </div>
    </CardAnimation>
  )
}
