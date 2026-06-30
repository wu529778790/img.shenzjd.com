'use client'

import { useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useUpload } from '@/hooks/useUpload'
import { UploadArea } from '@/components/upload/UploadArea'
import { UploadQueue } from '@/components/upload/UploadQueue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Zap } from 'lucide-react'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useAuthDialog, useConfigDialog } from '@/components/auth'
import { toast } from 'sonner'
import { useFramerMotion } from '@/hooks/useFramerMotion'

export default function HomePage() {
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const { openConfigDialog } = useConfigDialog()
  const configStore = useConfigStore()
  const { uploadQueue, addFiles, retryTask, retryAllFailed, removeTask } = useUpload()

  // ✅ 动态导入 framer-motion，减少首屏 JS 体积
  const Framer = useFramerMotion()
  const motion = Framer?.motion
  const AnimatePresence = Framer?.AnimatePresence

  // 检查配置是否完整
  const { owner, repo, branch } = configStore
  const isConfigured = owner && repo && branch

  // 处理文件选择（需要登录）
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
    if (!isConfigured) {
      // 未配置，打开配置引导弹窗
      toast.warning('请先配置 GitHub 仓库', {
        description: '需要配置仓库信息后才能上传图片',
        duration: 4000,
      })
      openConfigDialog()
      return
    }
    // 已登录已配置，正常上传
    addFiles(files)
  }, [session, isConfigured, openLoginDialog, openConfigDialog, addFiles])

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <PageTransition>
          <CardAnimation className="p-12 text-center rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-modern-md backdrop-blur-sm">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" aria-hidden="true" />
              <span className="text-gray-500" role="status">加载中...</span>
            </div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        {/* 上传区域 - 设置最小高度保持页面平衡 */}
        <CardAnimation
          delay={0.1}
          className="p-8 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 shadow-modern-lg backdrop-blur-sm min-h-[400px]"
        >
          <UploadArea onFilesSelected={handleFilesSelected} />

          {/* 上传队列 */}
          {AnimatePresence && motion && uploadQueue.length > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
                style={{ minHeight: 200 }} // ✅ 预留空间防止 CLS
              >
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">上传队列</h2>
                    <Badge variant="secondary" className="ml-1">
                      {uploadQueue.length}
                    </Badge>
                  </div>
                  {uploadQueue.some((task) => task.status === 'error') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={retryAllFailed}
                      className="gap-1"
                    >
                      重试全部失败
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

        {/* 提示信息 - 优化为单行布局 */}
        {motion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-200/60 dark:border-indigo-800/60 shadow-modern-sm backdrop-blur-sm"
            role="note"
          >
          <div className="flex items-center gap-2 text-sm text-indigo-900 dark:text-indigo-100">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" aria-hidden="true" />
            <span className="text-indigo-800 dark:text-indigo-200 font-medium">
              支持 PNG、JPG、JPEG、GIF、WEBP 格式，单文件最大 10MB，支持批量上传
            </span>
          </div>
        </motion.div>
        )}
      </PageTransition>
    </div>
  )
}
