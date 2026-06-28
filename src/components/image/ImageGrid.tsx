'use client'

import { useState } from 'react'
import { Search, Eye } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { LazyImageGrid } from './LazyImageGrid'
import { VirtualizedImageGrid } from './VirtualizedImageGrid'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { formatFileSize } from '@/lib/utils'
import { IMAGE_GRID_CONFIG } from '@/lib/constants'
import type { ImageFile } from '@/types/image'
import { cn } from '@/lib/utils'

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

  // 使用外部状态或内部状态
  const viewMode = externalViewMode ?? internalViewMode
  const selectionMode = externalSelectionMode ?? internalSelectionMode
  const selectedIds = externalSelectedIds ?? internalSelectedIds

  // 判断是否应该使用虚拟滚动
  const shouldUseVirtualization = images.length > IMAGE_GRID_CONFIG.VIRTUALIZATION_THRESHOLD

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
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3 text-gray-500 dark:text-gray-400">
              <div className="h-5 w-5 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
              <span>加载中...</span>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-24 h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                <ImageCardPlaceholder />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                暂无图片
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                上传您的第一张图片开始使用
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          // 网格视图 - 使用错误边界包裹
          <ErrorBoundary>
            <div>
              {shouldUseVirtualization ? (
                <VirtualizedImageGrid
                  images={images}
                  onDelete={onDelete}
                  onSelect={handleSelect}
                  selectedIds={selectedIds}
                  selectable={selectionMode}
                  onImageChange={onImageChange}
                />
              ) : (
                <LazyImageGrid
                  images={images}
                  onDelete={onDelete}
                  onSelect={handleSelect}
                  selectedIds={selectedIds}
                  selectable={selectionMode}
                  onImageChange={onImageChange}
                  initialLoadCount={images.length <= IMAGE_GRID_CONFIG.VIRTUALIZATION_THRESHOLD ? images.length : IMAGE_GRID_CONFIG.INITIAL_LOAD_COUNT}
                  batchSize={IMAGE_GRID_CONFIG.BATCH_SIZE}
                />
              )}
            </div>
          </ErrorBoundary>
        ) : (
          // 列表视图
          <div className="space-y-2">
            {images.map((image) => (
              <div
                key={image.id}
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
                <input
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
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
              </div>
            ))}
          </div>
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
