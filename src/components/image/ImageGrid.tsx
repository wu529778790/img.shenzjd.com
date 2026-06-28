'use client'

import { useState } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'
import { ImageCard } from './ImageCard'
import { ImageGridToolbar } from './ImageGridToolbar'
import { ImageGridListView } from './ImageGridListView'
import { BulkDeleteConfirm } from './BulkDeleteConfirm'
import { VirtualizedImageGrid, shouldVirtualize } from './VirtualizedImageGrid'
import type { ImageFile } from '@/types/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ANIMATION_CONFIG, createStaggerVariants, AnimatedListItem } from '@/components/animations/PageAnimations'

interface ImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  isLoading?: boolean
}

type ViewMode = 'grid' | 'list'

export function ImageGrid({ images, onDelete, onBulkDelete, isLoading = false }: ImageGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [copiedIds, setCopiedIds] = useState<Set<string>>(new Set())
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleBulkCopy = async () => {
    const count = selectedIds.size
    toast.success(`已复制 ${count} 个链接`)
    setCopiedIds(new Set(selectedIds))
    setTimeout(() => setCopiedIds(new Set()), 2000)
  }

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(id)
      } else {
        newSet.delete(id)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(images.map((img) => img.id)))
    }
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const handleToggleSelectionMode = () => {
    if (selectionMode) {
      // 退出多选模式时清除选择
      setSelectedIds(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  const handleBulkDelete = () => {
    if (!onBulkDelete || selectedIds.size === 0) return
    setShowDeleteConfirm(true)
  }

  const confirmBulkDelete = () => {
    if (!onBulkDelete) return
    onBulkDelete(Array.from(selectedIds))
    setSelectedIds(new Set())
    setShowDeleteConfirm(false)
  }

  const allSelected = images.length > 0 && selectedIds.size === images.length

  return (
    <>
      <div className="space-y-4">
        {/* 工具栏 */}
        {images.length > 0 && (
          <ImageGridToolbar
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCount={selectedIds.size}
            totalCount={images.length}
            allSelected={allSelected}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBulkCopy={handleBulkCopy}
            onBulkDelete={handleBulkDelete}
            copied={copiedIds.size > 0}
            selectionMode={selectionMode}
            onToggleSelectionMode={handleToggleSelectionMode}
          />
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

      {/* 批量删除确认弹窗 */}
      <BulkDeleteConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        images={images.filter((img) => selectedIds.has(img.id))}
        onConfirm={confirmBulkDelete}
      />
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
