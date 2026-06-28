'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import type { ImageFile } from '@/types/image'
import { ImageCard } from './ImageCard'
import { ImagePreview } from './ImagePreview'
import { IMAGE_GRID_CONFIG } from '@/lib/constants'

interface LazyImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  selectedIds?: Set<string>
  selectable?: boolean
  onImageChange?: (image: ImageFile) => void
  initialLoadCount?: number  // 初始加载数量
  batchSize?: number  // 每次加载的数量
}

/**
 * 懒加载图片网格组件
 * 只渲染可见区域的图片，大幅提升初始渲染性能
 */
export function LazyImageGrid({
  images,
  onDelete,
  onSelect,
  selectedIds = new Set(),
  selectable = false,
  onImageChange,
  initialLoadCount: initialLoadCountProp,
  batchSize = IMAGE_GRID_CONFIG.BATCH_SIZE,
}: LazyImageGridProps) {
  // 将计算逻辑提到 useMemo，避免每次 render 重复计算
  const resolvedInitialLoadCount = useMemo(
    () => (initialLoadCountProp ?? (images.length <= IMAGE_GRID_CONFIG.VIRTUALIZATION_THRESHOLD ? images.length : 24)),
    [initialLoadCountProp, images.length]
  )

  const [visibleCount, setVisibleCount] = useState(resolvedInitialLoadCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 当前可见的图片 - 使用 useMemo 缓存切片结果
  const visibleImages = useMemo(
    () => images.slice(0, visibleCount),
    [images, visibleCount]
  )

  const hasMore = visibleCount < images.length

  // 加载更多图片（防抖 + 延迟）- 使用 useCallback
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    // 使用双重 requestAnimationFrame + 延迟确保不阻塞主线程
    requestAnimationFrame(() => {
      setTimeout(() => {
        setVisibleCount((prev) => Math.min(prev + batchSize, images.length))
        setIsLoadingMore(false)
      }, 50) // 50ms 延迟让主线程有机会渲染
    })
  }, [isLoadingMore, hasMore, batchSize, images.length])

  // 设置预览图 - 使用 useCallback
  const handleSetPreviewImage = useCallback((image: ImageFile | null) => {
    setPreviewImage(image)
  }, [])

  // Intersection Observer 监听滚动到底部
  useEffect(() => {
    const loadMoreElement = loadMoreRef.current
    if (!loadMoreElement) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      {
        rootMargin: '200px', // 提前 200px 开始加载
        threshold: 0.1,
      }
    )

    observer.observe(loadMoreElement)

    return () => {
      observer.disconnect()
    }
  }, [hasMore, isLoadingMore, loadMore])

  return (
    <div className="space-y-4">
      {/* 图片网格 - 添加 contain 优化重绘性能 */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4"
        style={{
          // 优化网格容器的重绘性能
          contain: 'layout style',
        }}
      >
        {visibleImages.map((image, index) => (
          <div key={image.id}>
            <ImageCard
              image={image}
              onDelete={onDelete}
              onSelect={onSelect}
              selected={selectedIds.has(image.id)}
              selectable={selectable}
              priority={index < resolvedInitialLoadCount}
              onPreview={handleSetPreviewImage}
            />
          </div>
        ))}
      </div>

      {/* 加载更多触发器 */}
      {hasMore && (
        <div
          ref={loadMoreRef}
          className="flex items-center justify-center py-8"
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-primary rounded-full animate-spin" />
              <span>加载中... ({visibleCount}/{images.length})</span>
            </div>
          )}
        </div>
      )}

      {/* 加载完成提示 */}
      {!hasMore && images.length > resolvedInitialLoadCount && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          已显示全部 {images.length} 张图片
        </div>
      )}

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImagePreview
          image={previewImage}
          images={images}
          onImageChange={onImageChange}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  )
}
