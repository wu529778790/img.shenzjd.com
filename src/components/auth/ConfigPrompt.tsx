'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { FolderTree, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardAnimation } from '@/components/animations/PageAnimations'
import { motion } from 'framer-motion'

export interface ConfigPromptProps {
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
 * 统一的配置引导组件
 *
 * 用于在用户未配置图床时显示引导卡片
 * 确保整个应用的引导体验一致
 *
 * @example
 * <ConfigPrompt
 *   description="在开始之前，需要先配置您的 GitHub 仓库"
 *   buttonText="去配置"
 * />
 */
export function ConfigPrompt({
  title,
  description,
  buttonText,
  onButtonClick,
  className,
}: ConfigPromptProps) {
  const router = useRouter()

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick()
    } else {
      router.push('/settings?section=config')
    }
  }

  return (
    <CardAnimation className={className} delay={0.1}>
      <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        {/* 图标 */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6"
        >
          <FolderTree className="h-10 w-10 text-amber-600 dark:text-amber-400" />
        </motion.div>

        {/* 标题 */}
        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
          {title || '请先配置图床'}
        </h2>

        {/* 描述 */}
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {description || '在开始之前，需要先配置您的 GitHub 仓库'}
        </p>

        {/* 按钮 */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={handleClick} size="lg" className="w-full">
            {buttonText || '去配置'}
          </Button>
        </motion.div>
      </div>
    </CardAnimation>
  )
}
