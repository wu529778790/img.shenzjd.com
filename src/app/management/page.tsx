'use client'

import { useMemo, useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Lock, FolderTree, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useConfigStore } from '@/stores/configStore'
import { useImages } from '@/hooks/useImages'
import { ImageGrid } from '@/components/image/ImageGrid'
import { ManagementToolbar } from '@/components/image/ManagementToolbar'
import { PageTransition, CardAnimation } from '@/components/animations/PageAnimations'
import { motion } from 'framer-motion'
import { ManagementSkeleton } from '@/components/loading/Skeleton'

type SortField = 'name' | 'size' | 'path'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function ManagementPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const configStore = useConfigStore()

  const { images, isLoading, handleDelete, handleBulkDelete, isDeleting } = useImages()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedDirectory, setSelectedDirectory] = useState<string>('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())

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
        default:
          comparison = a.name.localeCompare(b.name)
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

  // 排序切换
  const handleSortFieldChange = useCallback((field: SortField) => {
    setSortField(field)
  }, [])

  const handleSortOrderToggle = useCallback(() => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
  }, [])

  const handleDirectoryChange = useCallback((dir: string) => {
    setSelectedDirectory(dir)
  }, [])

  // 多选相关
  const handleToggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      setSelectedIds(new Set())
    }
    setSelectionMode((prev) => !prev)
  }, [selectionMode])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredImages.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredImages.map((img) => img.id)))
    }
  }, [filteredImages, selectedIds.size])

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [])

  const handleBulkCopy = useCallback(async () => {
    const count = selectedIds.size
    const { toast } = await import('sonner')
    toast.success(`已复制 ${count} 个链接`)
    setCopiedIds(new Set(selectedIds))
    setTimeout(() => setCopiedIds(new Set()), 2000)
  }, [selectedIds])

  const handleBulkDeleteWithConfirm = useCallback(() => {
    if (selectedIds.size === 0) return
    handleBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [selectedIds, handleBulkDelete])

  const allSelected = filteredImages.length > 0 && selectedIds.size === filteredImages.length

  // 如果正在加载，显示骨架屏
  if (status === 'loading' || (isLoading && images.length === 0)) {
    return (
      <div className="min-h-[calc(100vh-4rem)]">
        <ManagementSkeleton />
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
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* 统一工具栏（单行） */}
          <div className="mb-4">
            <ManagementToolbar
              images={images}
              filteredCount={filteredImages.length}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortFieldChange={handleSortFieldChange}
              onSortOrderToggle={handleSortOrderToggle}
              directories={directories}
              selectedDirectory={selectedDirectory}
              onDirectoryChange={handleDirectoryChange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectionMode={selectionMode}
              onToggleSelectionMode={handleToggleSelectionMode}
              selectedCount={selectedIds.size}
              allSelected={allSelected}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              onBulkCopy={handleBulkCopy}
              onBulkDelete={handleBulkDeleteWithConfirm}
              copied={copiedIds.size > 0}
            />
          </div>

          {/* 图片网格 - 移除 PageTransition 和动画，减少性能开销 */}
          <div className="transition-opacity duration-200">
            <ImageGrid
              images={filteredImages}
              onDelete={handleDelete}
              onBulkDelete={handleBulkDelete}
              isLoading={isLoading}
              viewMode={viewMode}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelect={(id, selected) => {
                setSelectedIds((prev) => {
                  const newSet = new Set(prev)
                  if (selected) newSet.add(id)
                  else newSet.delete(id)
                  return newSet
                })
              }}
            />
          </div>

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
                    <Button onClick={() => router.push('/')} className="mt-4">
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
