'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import type { ImageFile } from '@/types/image'
import { ImageCard } from './ImageCard'

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
  initialLoadCount = 12,  // 首屏只渲染 12 张
  batchSize = 12,  // 每次滚动再加载 12 张
}: LazyImageGridProps) {
  const [visibleCount, setVisibleCount] = useState(initialLoadCount)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 当前可见的图片
  const visibleImages = images.slice(0, visibleCount)
  const hasMore = visibleCount < images.length

  // 加载更多图片（防抖）
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    // 使用 requestAnimationFrame 确保不阻塞主线程
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisibleCount((prev) => Math.min(prev + batchSize, images.length))
        setIsLoadingMore(false)
      })
    })
  }, [isLoadingMore, hasMore, batchSize, images.length])

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
      {/* 图片网格 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {visibleImages.map((image, index) => (
          <div key={image.id}>
            <ImageCard
              image={image}
              images={images}
              onImageChange={onImageChange}
              onDelete={onDelete}
              onSelect={onSelect}
              selected={selectedIds.has(image.id)}
              selectable={selectable}
              priority={index < initialLoadCount} // 只优先加载首屏图片
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
      {!hasMore && images.length > initialLoadCount && (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
          已显示全部 {images.length} 张图片
        </div>
      )}
    </div>
  )
}
