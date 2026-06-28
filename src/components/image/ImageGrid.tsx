'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import { ImageCard } from './ImageCard'
import { ImageGridListView } from './ImageGridListView'
import { BulkDeleteConfirm } from './BulkDeleteConfirm'
import { VirtualizedImageGrid, shouldVirtualize } from './VirtualizedImageGrid'
import type { ImageFile } from '@/types/image'
import { motion } from 'framer-motion'
import { ANIMATION_CONFIG, createStaggerVariants, AnimatedListItem } from '@/components/animations/PageAnimations'

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
          shouldVirtualize(images.length) ? (
            <VirtualizedImageGrid
              images={images}
              onDelete={onDelete}
              onSelect={handleSelect}
              selectedIds={selectedIds}
              selectable={selectionMode}
            />
          ) : (
            <motion.div
              variants={createStaggerVariants()}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
            >
              {images.map((image, index) => (
                <AnimatedListItem key={image.id}>
                  <ImageCard
                    image={image}
                    images={images}
                    onImageChange={onImageChange}
                    onDelete={onDelete}
                    onSelect={handleSelect}
                    selected={selectedIds.has(image.id)}
                    selectable={selectionMode}
                    priority={index < 5}
                  />
                </AnimatedListItem>
              ))}
            </motion.div>
          )
        ) : (
          <ImageGridListView
            images={images}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            selectionMode={selectionMode}
          />
        )}
      </div>
    </>
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
