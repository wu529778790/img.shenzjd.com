'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { ImageCard } from './ImageCard'
import { ImageGridListView } from './ImageGridListView'
import { BulkDeleteConfirm } from './BulkDeleteConfirm'
import { LazyImageGrid } from './LazyImageGrid'
import type { ImageFile } from '@/types/image'
import { motion } from 'framer-motion'

type ViewMode = 'grid' | 'list'

interface ImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  isLoading?: boolean
  // 从外部接收的视图和选择状态
  viewMode?: ViewMode
  selectionMode?: boolean
  selectedIds?: Set<string>
  onSelect?: (id: string, selected: boolean) => void
  onImageChange?: (image: ImageFile) => void
}

export function ImageGrid({
  images,
  onDelete,
  onBulkDelete,
  isLoading = false,
  viewMode: externalViewMode,
  selectionMode: externalSelectionMode,
  selectedIds: externalSelectedIds,
  onSelect,
  onImageChange,
}: ImageGridProps) {
  // 内部状态（用于独立使用时的回退）
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('grid')
  const [internalSelectionMode, setInternalSelectionMode] = useState(false)
  const [internalSelectedIds, setInternalSelectedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // 使用外部状态或内部状态
  const viewMode = externalViewMode ?? internalViewMode
  const selectionMode = externalSelectionMode ?? internalSelectionMode
  const selectedIds = externalSelectedIds ?? internalSelectedIds

  const handleSelect = (id: string, selected: boolean) => {
    if (onSelect) {
      onSelect(id, selected)
    } else {
      setInternalSelectedIds((prev) => {
        const newSet = new Set(prev)
        if (selected) newSet.add(id)
        else newSet.delete(id)
        return newSet
      })
    }
  }

  const allSelected = images.length > 0 && selectedIds.size === images.length

  return (
    <>
      <div className="space-y-4">
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
          <LazyImageGrid
            images={images}
            onDelete={onDelete}
            onSelect={handleSelect}
            selectedIds={selectedIds}
            selectable={selectionMode}
            onImageChange={onImageChange}
            initialLoadCount={images.length <= 30 ? images.length : 24}
            batchSize={12}
          />
        ) : (
          // 普通网格（图片数量 ≤ 50）
          <motion.div
            variants={createStaggerVariants(images.length)}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4"
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
        )
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
