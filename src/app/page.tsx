'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useUpload } from '@/hooks/useUpload'
import { useRepoFolders, type RepoFolder } from '@/hooks/useRepoFolders'
import { UploadArea } from '@/components/upload/UploadArea'
import { UploadQueue } from '@/components/upload/UploadQueue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, Zap, UploadCloud, FolderOpen } from 'lucide-react'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { useAuthDialog, useConfigDialog } from '@/components/auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useFramerMotion } from '@/hooks/useFramerMotion'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { openLoginDialog } = useAuthDialog()
  const { openConfigDialog, isConfigDismissed } = useConfigDialog()
  const configStore = useConfigStore()
  const { uploadQueue, addFiles, retryTask, retryAllFailed, removeTask } = useUpload()
  const { data: folders = [], isLoading: foldersLoading } = useRepoFolders()
  const foldersList = folders as RepoFolder[]

  // ✅ 动态导入 framer-motion，减少首屏 JS 体积
  const Framer = useFramerMotion()
  const motion = Framer?.motion
  const AnimatePresence = Framer?.AnimatePresence

  // 检查配置是否完整
  const { owner, repo, branch } = configStore
  const isConfigured = owner && repo && branch

  // 当前选择的文件夹路径
  const [selectedFolder, setSelectedFolder] = useState(configStore.directory || '')

  // 处理文件夹变更
  const handleFolderChange = (folderPath: string | null) => {
    const path = folderPath || ''
    setSelectedFolder(path)
    configStore.updateConfig({ directory: path })
  }

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

          {/* 文件夹选择 - 仅登录后显示 */}
          {session && motion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-6"
              aria-label="上传目标文件夹选择"
            >
              <div className="p-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/30 border border-gray-200/80 dark:border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <FolderOpen className="h-4 w-4 text-gray-600 dark:text-gray-400 shrink-0" aria-hidden="true" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">上传到</span>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded" aria-label="当前仓库">
                    {owner}/{repo}
                  </span>
                  <span className="text-xs text-gray-400" aria-hidden="true">/</span>
                  <div className="flex items-center gap-1.5">
                    <label htmlFor="folder-select" className="text-xs text-gray-600 dark:text-gray-400">
                      文件夹
                    </label>
                    <Select
                      value={selectedFolder}
                      onValueChange={handleFolderChange}
                    >
                      <SelectTrigger id="folder-select" className="w-[110px] h-8">
                        <SelectValue placeholder="根目录" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">
                          <span className="text-gray-500">根目录</span>
                        </SelectItem>
                        {foldersList.map((folder) => (
                          <SelectItem key={folder.path} value={folder.path}>
                            <span className="font-mono text-sm">{folder.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedFolder && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                      <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-xs" title={selectedFolder}>{selectedFolder}</code>
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 上传队列 */}
          {AnimatePresence && uploadQueue.length > 0 && (
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
