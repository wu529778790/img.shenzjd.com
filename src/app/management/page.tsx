'use client'

import { useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search,
  FolderTree,
  Lock,
  ArrowUp,
  ArrowDown,
  X,
  FolderOpen,
  Image as ImageIcon
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ImageStats } from '@/components/image/ImageStats'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ManagementSkeleton } from '@/components/loading/Skeleton'

type SortField = 'name' | 'size' | 'path' | 'uploaded_at'
type SortOrder = 'asc' | 'desc'

export default function ManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore = useConfigStore()

  const { images, isLoading, handleDelete, handleBulkDelete, isDeleting } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('uploaded_at')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  // 检查配置是否完整
  const isConfigured = configStore.owner && configStore.repo && configStore.branch

  // 使用 useMemo 缓存过滤和排序结果
  const filteredImages = useMemo(() => {
    const filtered = images.filter((image) => {
      const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDirectory = !selectedDirectory || image.path.startsWith(selectedDirectory)
      return matchesSearch && matchesDirectory
    })

    return filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'size':
          comparison = a.size - b.size
          break
        case 'path':
          comparison = a.path.localeCompare(b.path)
          break
        case 'uploaded_at':
        default:
          comparison = (a.uploaded_at?.getTime() || 0) - (b.uploaded_at?.getTime() || 0)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [images, searchQuery, selectedDirectory, sortField, sortOrder])

  // 使用 useMemo 提取目录树
  const directories = useMemo(() => {
    return Array.from(
      new Set(
        images
          .map((img) => {
            const parts = img.path.split('/')
            return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
          })
          .filter(Boolean)
      )
    )
  }, [images])

  // 使用 useCallback 优化事件处理
  const handleSort = useCallback((field: SortField) => {
    setSortField(field)
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }, [])

  const handleDirectoryChange = useCallback((dir: string) => {
    setSelectedDirectory(prev => prev === dir ? '' : dir)
  }, [])

  // 统计数据
  const stats = useMemo(() => {
    if (images.length === 0) return null
    return {
      total: images.length,
      totalSize: images.reduce((sum, img) => sum + img.size, 0),
    }
  }, [images])

  // 如果正在加载，显示骨架屏
  if (status === 'loading' || (isLoading && images.length === 0)) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageTransition>
          <ManagementSkeleton />
        </PageTransition>
      </div>
    )
  }

  // 如果未登录，显示登录提示
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <PageTransition>
          <CardAnimation className="max-w-md w-full mx-4 p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
            >
              <Lock className="h-10 w-10 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              需要登录
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              登录后才能管理图片
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => router.push('/login')} size="lg" className="w-full">
                立即登录
              </Button>
            </motion.div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <PageTransition>
          <CardAnimation className="max-w-md w-full mx-4 p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center mb-6"
            >
              <FolderTree className="h-10 w-10 text-gray-400" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
              请先配置图床
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              在开始之前，需要先配置您的 GitHub 仓库
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button onClick={() => router.push('/config')} size="lg" className="w-full">
                去配置
              </Button>
            </motion.div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <PageTransition>
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* 顶部工具栏 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <CardAnimation className="p-3 sm:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
              {/* 统计和搜索区域 */}
              <div className="flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                {/* 左侧：统计信息 */}
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <ImageStats images={images} />
                  {stats && (
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant="secondary" className="font-medium text-xs">
                        {stats.total} 张图片
                      </Badge>
                      <span className="hidden sm:inline text-gray-300 dark:text-gray-700">|</span>
                      <span className="font-mono text-xs">
                        {stats.totalSize > 0 ? (stats.totalSize / 1024 / 1024).toFixed(1) : '0.0'} MB
                      </span>
                    </div>
                  )}
                </div>

                {/* 右侧：搜索框 */}
                <div className="relative w-full lg:w-64 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="搜索图片..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(
                      "pl-10 h-10 rounded-xl border-gray-200 dark:border-gray-700",
                      "focus:ring-2 focus:ring-primary/20 focus:border-primary",
                      "transition-all duration-200",
                      searchQuery && "pr-9"
                    )}
                    aria-label="搜索图片"
                  />
                  {searchQuery && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                      aria-label="清除搜索"
                    >
                      <X className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
              </div>

              {/* 排序和过滤区域 */}
              <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {/* 排序按钮组 */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    排序:
                  </span>
                  <div className="flex gap-1">
                    {[
                      { field: 'name' as SortField, label: '名称' },
                      { field: 'size' as SortField, label: '大小' },
                      { field: 'uploaded_at' as SortField, label: '日期' },
                    ].map(({ field, label }) => (
                      <motion.div
                        key={field}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          variant={sortField === field ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSort(field)}
                          className={cn(
                            "h-8 px-3 rounded-lg font-medium transition-all",
                            sortField === field
                              ? "shadow-sm"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                          aria-label={`按${label}排序`}
                        >
                          <span className="hidden sm:inline">{label}</span>
                          <span className="sm:hidden">{label[0]}</span>
                          {sortField === field && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-1"
                            >
                              {sortOrder === 'asc' ? (
                                <ArrowUp className="h-3.5 w-3.5" />
                              ) : (
                                <ArrowDown className="h-3.5 w-3.5" />
                              )}
                            </motion.div>
                          )}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 目录过滤 */}
                {directories.length > 0 && (
                  <>
                    <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <FolderOpen className="h-4 w-4 text-gray-500" />
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                        目录:
                      </span>
                      <div className="flex gap-1 flex-wrap">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedDirectory('')}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            !selectedDirectory
                              ? "bg-primary text-white shadow-sm"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                          )}
                        >
                          全部
                        </motion.button>
                        {directories.slice(0, 5).map((dir) => (
                          <motion.button
                            key={dir}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleDirectoryChange(dir)}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-medium transition-all truncate max-w-[150px]",
                              selectedDirectory === dir
                                ? "bg-primary text-white shadow-sm"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                            title={dir}
                          >
                            {dir.split('/').pop()}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardAnimation>
          </motion.div>

          {/* 图片网格 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <ImageGrid
              images={filteredImages}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              isLoading={isLoading}
            />
          </motion.div>

          {/* 空状态 */}
          {!isLoading && filteredImages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16 px-4"
            >
              <div className="max-w-md mx-auto space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center"
                >
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {searchQuery || selectedDirectory ? '没有找到图片' : '暂无图片'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? `没有找到匹配"${searchQuery}"的图片`
                    : selectedDirectory
                    ? `"${selectedDirectory}"目录下没有图片`
                    : '上传您的第一张图片开始使用'}
                </p>
                {!searchQuery && !selectedDirectory && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button onClick={() => router.push('/upload')} className="mt-4">
                      上传图片
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </PageTransition>
    </div>
  )
}
