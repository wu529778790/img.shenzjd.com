'use client'

import { Eye } from 'lucide-react'
import { LazyImageGrid } from './LazyImageGrid'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { IMAGE_GRID_CONFIG } from '@/lib/constants'
import type { ImageFile } from '@/types/image'

type ViewMode = 'grid' | 'list'

interface ImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onBulkDelete?: (ids: string[]) => void
  isLoading?: boolean
  // 视图模式
  viewMode?: ViewMode
  onPreview?: (image: ImageFile) => void
  onImageChange?: (image: ImageFile) => void
}

export function ImageGrid({
  images,
  onDelete,
  isLoading = false,
  viewMode: externalViewMode,
  onPreview,
  onImageChange,
}: ImageGridProps) {
  const viewMode = externalViewMode ?? 'grid'

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
              const handleEyeClick = (e: React.MouseEvent) => {
                e.stopPropagation()
                onPreview?.(image)
              }

              return (
                <div
                  key={image.id}
                  className={cn(
                    'flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-xl border-2',
                    'bg-white dark:bg-gray-800',
                    'border-gray-200 dark:border-gray-700',
                    'hover:border-primary/30 dark:hover:border-primary/30',
                    'hover:bg-primary/5 dark:hover:bg-primary/10',
                    'transition-all duration-200 cursor-pointer',
                    'group'
                  )}
                  onClick={() => onPreview?.(image)}
                >
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium truncate group-hover:text-primary transition-colors leading-tight">
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {formatFileSize(image.size)}
                    </p>
                  </div>
                  {/* 眼睛图标 - 预览 */}
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
