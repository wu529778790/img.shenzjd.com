'use client'

import { useRouter } from 'next/navigation'
import { FolderTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CardAnimation } from '@/components/animations/PageAnimations'
import { useFramerMotion } from '@/hooks/useFramerMotion'

export interface ConfigPromptProps {
  title?: string
  description?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
}

export function ConfigPrompt({
  title,
  description,
  buttonText,
  onButtonClick,
  className,
}: ConfigPromptProps) {
  const router = useRouter()
  const Framer = useFramerMotion()
  const motion = Framer?.motion
  const MotionDiv = motion?.div

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick()
    } else {
      router.push('/settings?section=config')
    }
  }

  const iconEl = (
    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6">
      <FolderTree className="h-10 w-10 text-amber-600 dark:text-amber-400" />
    </div>
  )

  return (
    <CardAnimation className={className} delay={0.1}>
      <div className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white/80 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/50 shadow-modern-lg backdrop-blur-sm">
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
          {title || '请先配置图床'}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {description || '在开始之前，需要先配置您的 GitHub 仓库'}
        </p>

        {MotionDiv ? (
          <MotionDiv whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button onClick={handleClick} size="lg" variant="gradient" className="w-full">
              {buttonText || '去配置'}
            </Button>
          </MotionDiv>
        ) : (
          <Button onClick={handleClick} size="lg" variant="gradient" className="w-full">
            {buttonText || '去配置'}
          </Button>
        )}
      </div>
    </CardAnimation>
  )
}
