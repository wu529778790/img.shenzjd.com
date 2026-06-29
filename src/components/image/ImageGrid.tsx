'use client'

import { useMemo, useCallback } from 'react'
import { Search, Eye } from 'lucide-react'
import { ImageCard } from './ImageCard'
import { LazyImageGrid } from './LazyImageGrid'
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
  onPreview?: (image: ImageFile) => void
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
  onPreview,
  onImageChange,
}: ImageGridProps) {
  // 使用外部状态或内部状态
  const viewMode = externalViewMode ?? 'grid'
  const selectionMode = externalSelectionMode ?? false
  const selectedIds = externalSelectedIds ?? new Set<string>()

  const handleSelect = useCallback((id: string, selected: boolean) => {
    if (onSelect) {
      onSelect(id, selected)
    }
  }, [onSelect])

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
        ) : images.length === 0 ? null : viewMode === 'grid' ? (
          // 网格视图 - 使用错误边界包裹
          <ErrorBoundary>
            <div className="min-h-0">
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
            </div>
          </ErrorBoundary>
        ) : (
          // 列表视图
          <div className="space-y-2">
            {images.map((image) => {
              // 根据是否在选择模式决定点击行为
              const handleRowClick = () => {
                if (selectionMode) {
                  // 选择模式：点击整行用于选择
                  onSelect?.(image.id, !selectedIds.has(image.id))
                } else {
                  // 普通模式：点击整行用于预览
                  onPreview?.(image)
                }
              }

              const handleEyeClick = (e: React.MouseEvent) => {
                e.stopPropagation()
                // 眼睛图标始终用于预览，无论是否在选择模式
                onPreview?.(image)
              }

              return (
                <div
                  key={image.id}
                  className={`
                    flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl border-2
                    bg-white dark:bg-gray-800
                    border-gray-200 dark:border-gray-700
                    hover:border-primary/30 dark:hover:border-primary/30
                    hover:bg-primary/5 dark:hover:bg-primary/10
                    transition-all duration-200 cursor-pointer
                    group
                    ${selectedIds.has(image.id) ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''}
                  `}
                  onClick={handleRowClick}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(image.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      onSelect?.(image.id, e.target.checked)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all"
                  />
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium truncate group-hover:text-primary transition-colors leading-tight">
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                  {/* 眼睛图标 - 始终显示并可用于预览 */}
                  <button
                    onClick={handleEyeClick}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 flex-shrink-0"
                    aria-label="预览图片"
                    title="预览图片"
                  >
                    <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  </button>
                </div>
              )
            })}
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
