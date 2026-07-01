'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useUpload } from '@/hooks/useUpload'
import { UploadArea } from '@/components/upload/UploadArea'
import { UploadQueue } from '@/components/upload/UploadQueue'
import { AdvancedConfig } from '@/components/upload/AdvancedConfig'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, RefreshCw } from 'lucide-react'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useAuthDialog } from '@/components/auth'
import { toast } from 'sonner'
import { useFramerMotion } from '@/hooks/useFramerMotion'

export default function HomePage() {
  const { data: session } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const { uploadQueue, addFiles, retryTask, retryAllFailed, removeTask } = useUpload()

  // ✅ 动态导入 framer-motion，减少首屏 JS 体积
  const Framer = useFramerMotion()
  const motion = Framer?.motion
  const AnimatePresence = Framer?.AnimatePresence

  // 处理文件选择（只需登录即可，配置由系统自动完成）
  const handleFilesSelected = useCallback((files: File[]) => {
    if (!session) {
      // 未登录，打开登录弹窗
      toast.info('请先登录', {
        description: '登录后即可上传图片到 GitHub',
        duration: 3000,
      })
      openLoginDialog()
      return
    }
    // 已登录，正常上传（配置由 ConfigDiscovery 自动初始化）
    addFiles(files)
  }, [session, openLoginDialog, addFiles])

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-5xl">
      <PageTransition>
        {/* 上传区域 */}
        <CardAnimation
          delay={0.1}
          className="p-6 sm:p-8 rounded-2xl bg-card border shadow-sm"
        >
          <UploadArea onFilesSelected={handleFilesSelected} />

          {/* 优化：上传队列 - 添加间距和动画 */}
          {AnimatePresence && motion && uploadQueue.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="mt-6 sm:mt-8"
                style={{ minHeight: 200 }} // ✅ 预留空间防止 CLS
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="flex items-center justify-between mb-4 pb-3 border-b"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
                    <h2 className="text-lg sm:text-xl font-semibold">上传队列</h2>
                    <Badge variant="secondary" className="ml-1">
                      {uploadQueue.length}
                    </Badge>
                  </div>
                  {uploadQueue.some((task) => task.status === 'error') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryAllFailed}
                      className="gap-1.5 h-8"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">重试全部失败</span>
                      <span className="sm:hidden">重试</span>
                    </Button>
                  )}
                </motion.div>
                <UploadQueue
                  queue={uploadQueue}
                  onRetry={(task) => retryTask(task.id)}
                  onRemove={removeTask}
                />
              </motion.div>
            </AnimatePresence>
          )}
        </CardAnimation>

        {/* 高级配置 */}
        <AdvancedConfig />
      </PageTransition>
    </div>
  )
}
