'use client'

import { useState } from 'react'
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
import { Image as ImageIcon, Sparkles, Zap, UploadCloud, FolderOpen } from 'lucide-react'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export default function HomePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore = useConfigStore()
  const { uploadQueue, addFiles, retryTask, retryAllFailed, removeTask } = useUpload()
  const { data: folders = [], isLoading: foldersLoading } = useRepoFolders()
  const foldersList = folders as RepoFolder[]

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

  // 如果正在加载
  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="p-12 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="text-gray-500">加载中...</div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  // 如果未登录，显示登录提示
  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6"
            >
              <ImageIcon className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              需要登录
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              登录后才能上传图片和管理图床
            </p>
            <p className="text-sm text-gray-400">
              请先登录以继续
            </p>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-6"
            >
              <UploadCloud className="h-10 w-10 text-primary" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              请先配置图床
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              在开始上传之前，需要先配置您的 GitHub 仓库
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => router.push('/config')} size="lg">
                去配置
              </Button>
            </motion.div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <PageTransition>
        {/* 上传区域 */}
        <CardAnimation
          delay={0.1}
          className="p-8 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
        >
          <UploadArea onFilesSelected={addFiles} />

          {/* 文件夹选择 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-6"
          >
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FolderOpen className="h-4 w-4" />
                  <span>上传图片到</span>
                  <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                    {owner}/{repo}
                  </span>
                  <span>，选择文件夹:</span>
                </div>
                <Select
                  value={selectedFolder}
                  onValueChange={handleFolderChange}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="选择文件夹" />
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
                {selectedFolder && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    当前: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">{selectedFolder}</code>
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* 上传队列 */}
          <AnimatePresence>
            {uploadQueue.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-8"
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
            )}
          </AnimatePresence>
        </CardAnimation>

        {/* 提示信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
        >
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">提示</p>
              <p className="text-blue-700 dark:text-blue-300">
                支持的格式：PNG、JPG、JPEG、GIF、WEBP。单文件最大 10MB。支持批量上传。
              </p>
            </div>
          </div>
        </motion.div>
      </PageTransition>
    </div>
  )
}
