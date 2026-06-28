'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, FolderTree, Loader2, Lock, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, X, Image as ImageIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ImageStats } from '@/components/image/ImageStats'
import { OperationLogPanel } from '@/components/OperationLogPanel'
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
  const [showFilters, setShowFilters] = useState(false)

  // 检查配置是否完整
  const isConfigured = configStore.owner && configStore.repo && configStore.branch

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
      <div className="container mx-auto px-4 py-8">
        <PageTransition>
          <CardAnimation className="max-w-md mx-auto p-8 text-center rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
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
              <Button onClick={() => router.push('/config')} size="lg">
                去配置
              </Button>
            </motion.div>
          </CardAnimation>
        </PageTransition>
      </div>
    )
  }

  // 过滤图片
  let filteredImages = images.filter((image) => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesDirectory = !selectedDirectory || image.path.startsWith(selectedDirectory)
    return matchesSearch && matchesDirectory
  })

  // 排序图片
  filteredImages.sort((a, b) => {
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

  // 切换排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // 提取目录树
  const directories = Array.from(
    new Set(
      images
        .map((img) => {
          const parts = img.path.split('/')
          return parts.length > 1 ? parts.slice(0, -1).join('/') : ''
        })
        .filter(Boolean)
    )
  )

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <PageTransition>
        {/* 页面标题 */}
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent"
          >
            图片管理
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mt-2 text-gray-500 dark:text-gray-400"
          >
            <span>管理您的图片</span>
            <Badge variant="secondary">
              {images.length} 张
            </Badge>
          </motion.div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* 侧边栏 - 目录树 */}
          <AnimatePresence>
            {directories.length > 0 && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 flex-shrink-0"
              >
                <CardAnimation className="sticky top-20 p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <FolderTree className="h-5 w-5 text-primary" />
                    <h2 className="font-semibold text-lg">目录</h2>
                  </div>
                  <div className="space-y-1">
                    <motion.button
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                        !selectedDirectory
                          ? 'bg-primary text-white shadow-md'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      )}
                      onClick={() => setSelectedDirectory('')}
                    >
                      全部图片
                    </motion.button>
                    {directories.map((dir) => (
                      <motion.button
                        key={dir}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                          selectedDirectory === dir
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        )}
                        onClick={() => setSelectedDirectory(dir)}
                      >
                        <span className="truncate block">{dir}</span>
                      </motion.button>
                    ))}
                  </div>
                </CardAnimation>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* 主内容区 */}
          <div className="flex-1 min-w-0">
            {/* 搜索栏和排序 */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6 flex flex-col sm:flex-row gap-3"
            >
              {/* 搜索框 */}
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <Input
                  type="text"
                  placeholder="搜索图片名称..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </motion.button>
                )}
              </div>

              {/* 排序按钮组 */}
              <div className="flex gap-2">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleSort('name')}
                    className={cn(
                      'h-11 px-4 rounded-xl transition-all',
                      sortField === 'name' && 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                    )}
                  >
                    <span className="hidden sm:inline">名称</span>
                    <span className="sm:hidden">名称</span>
                    {sortField === 'name' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1"
                      >
                        {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleSort('size')}
                    className={cn(
                      'h-11 px-4 rounded-xl transition-all',
                      sortField === 'size' && 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                    )}
                  >
                    <span className="hidden sm:inline">大小</span>
                    <span className="sm:hidden">大小</span>
                    {sortField === 'size' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1"
                      >
                        {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </motion.div>
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => handleSort('uploaded_at')}
                    className={cn(
                      'h-11 px-4 rounded-xl transition-all',
                      sortField === 'uploaded_at' && 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                    )}
                  >
                    <span className="hidden sm:inline">日期</span>
                    <span className="sm:hidden">日期</span>
                    {sortField === 'uploaded_at' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-1"
                      >
                        {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                      </motion.div>
                    )}
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* 图片统计 */}
            <ImageStats images={images} />

            {/* 图片列表 */}
            <ImageGrid
              images={filteredImages}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              isLoading={isLoading}
            />
          </div>

          {/* Right sidebar — operation log */}
          <div className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <OperationLogPanel />
            </div>
          </div>
        </div>
      </PageTransition>
    </div>
  )
}
