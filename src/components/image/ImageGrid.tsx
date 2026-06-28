'use client'

import { useState } from 'react'
import { LayoutGrid, List, Trash2, Copy, Check, Search, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'
import { ImageCard } from './ImageCard'
import type { ImageFile } from '@/types/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ANIMATION_CONFIG, createStaggerVariants, AnimatedList, AnimatedListItem } from '@/components/animations/PageAnimations'

interface ImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  isLoading?: boolean
}

type ViewMode = 'grid' | 'list'

export function ImageGrid({ images, onDelete, onBulkDelete, isLoading = false }: ImageGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)

  const handleBulkCopy = async () => {
    const count = selectedIds.size
    toast.success(`已复制 ${count} 个链接`)
    setCopiedIds(new Set(selectedIds))
    setTimeout(() => setCopiedIds(new Set()), 2000)
    setShowBulkActions(false)
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      // 延迟更新 showBulkActions 以确保状态正确
      setTimeout(() => setShowBulkActions(newSet.size > 0), 0)
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
      setShowBulkActions(false)
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)))
      setShowBulkActions(true)
    }
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setShowBulkActions(false)
  }

  const handleBulkDelete = () => {
    if (!onBulkDelete || selectedIds.size === 0) return

    if (!confirm(`确定要删除选中的 ${selectedIds.size} 个文件吗？`)) return

    onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowBulkActions(false)
  }

  const allSelected = images.length > 0 && selectedIds.size === images.length

  return (
    <div className="space-y-4">
      {/* 工具栏 */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            {/* 全选 */}
            <label className="flex items-center gap-2 text-sm cursor-pointer group">
              <motion.input
                whileTap={{ scale: 0.9 }}
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
              />
              <span className="group-hover:text-primary transition-colors">
                全选
              </span>
            </label>

            {/* 批量操作按钮 */}
            <AnimatePresence>
              {selectedIds.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2 overflow-hidden"
                >
                  <div className="w-px h-6 bg-gray-200 dark:bg-gray-700" />
                  <span className="text-sm text-primary font-medium px-2">
                    {selectedIds.size} 项已选
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSelection}
                    className="gap-1"
                  >
                    取消选择
                  </Button>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkCopy}
                      className="gap-1"
                    >
                      {copiedIds.size > 0 ? (
                        <>
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          复制链接
                        </>
                      )}
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkDelete}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            {/* 视图切换 */}
            <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                  className="h-8 px-3"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 图片网格/列表 */}
      {isLoading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center gap-3 text-gray-500 dark:text-gray-400">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Search className="h-5 w-5" />
            </motion.div>
            <span>加载中...</span>
          </div>
        </motion.div>
      ) : images.length === 0 ? (
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
              <ImageCardPlaceholder />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              暂无图片
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              上传您的第一张图片开始使用
            </p>
          </div>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <motion.div
          variants={createStaggerVariants(images.length)}
          initial="initial"
          animate="animate"
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4"
        >
          {images.map((image, index) => (
            <AnimatedListItem key={image.id}>
              <ImageCard
                image={image}
                onDelete={onDelete}
                onSelect={handleSelect}
                selected={selectedIds.has(image.id)}
                selectable
                priority={index < 5} // 前5张图片优先加载，避免LCP警告
              />
            </AnimatedListItem>
          ))}
        </motion.div>
      ) : (
        <motion.div
          initial="initial"
          animate="animate"
          variants={createStaggerVariants(images.length, 20)}
          className="space-y-2"
        >
          {images.map((image) => (
            <AnimatedListItem key={image.id}>
              <motion.div
                layout
                whileHover={{ x: 4 }}
                className={`
                  flex items-center gap-4 p-4 rounded-xl border-2
                  bg-white dark:bg-gray-800
                  border-gray-200 dark:border-gray-700
                  hover:border-primary/30 dark:hover:border-primary/30
                  hover:bg-primary/5 dark:hover:bg-primary/10
                  transition-all duration-200 cursor-pointer
                  group
                  ${selectedIds.has(image.id) ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''}
                `}
                onClick={() => handleSelect(image.id, !selectedIds.has(image.id))}
              >
                <motion.input
                  whileTap={{ scale: 0.9 }}
                  type="checkbox"
                  checked={selectedIds.has(image.id)}
                  onChange={() => handleSelect(image.id, !selectedIds.has(image.id))}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate group-hover:text-primary transition-colors">
                    {image.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(image.size)}
                  </p>
                </div>
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Eye className="h-5 w-5 text-primary" />
                </motion.div>
              </motion.div>
            </AnimatedListItem>
          ))}
        </motion.div>
      )}
    </div>
  )
}

// 占位图标组件
function ImageCardPlaceholder() {
  return (
    <svg
      className="h-12 w-12 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  )
}
