'use client'

import { useRef, useMemo, useEffect, useState, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ImageCard } from '@/components/image/ImageCard'
import { ImagePreview } from './ImagePreview'
import { IMAGE_GRID_CONFIG } from '@/lib/constants'
import type { ImageFile } from '@/types/image'

interface VirtualizedImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  selectedIds?: Set<string>
  selectable?: boolean
  onPreview?: (image: ImageFile) => void
  onImageChange?: (image: ImageFile) => void
  overscan?: number  // 预渲染行数
}

/**
 * 虚拟滚动图片网格组件
 * 使用 @tanstack/react-virtual 实现高性能虚拟滚动
 * 只渲染可见区域的图片，支持大量图片（1000+）流畅滚动
 */
export function VirtualizedImageGrid({
  images,
  onDelete,
  onSelect,
  selectedIds = new Set(),
  selectable = false,
  onPreview,
  onImageChange,
  overscan = IMAGE_GRID_CONFIG.VIRTUALIZATION_OVERSCAN,
}: VirtualizedImageGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [previewImage, setPreviewImage] = useState<ImageFile | null>(null)

  // 根据容器宽度动态计算列数
  const columns = useMemo(() => {
    if (!containerWidth) return IMAGE_GRID_CONFIG.COLUMNS.wide

    if (containerWidth >= IMAGE_GRID_CONFIG.BREAKPOINTS.lg) return IMAGE_GRID_CONFIG.COLUMNS.wide
    if (containerWidth >= IMAGE_GRID_CONFIG.BREAKPOINTS.md) return IMAGE_GRID_CONFIG.COLUMNS.desktop
    if (containerWidth >= IMAGE_GRID_CONFIG.BREAKPOINTS.sm) return IMAGE_GRID_CONFIG.COLUMNS.tablet
    return IMAGE_GRID_CONFIG.COLUMNS.mobile
  }, [containerWidth])

  // 计算行数
  const rowCount = Math.ceil(images.length / columns)

  // 预估行高（图片卡片 + gap）
  const estimatedRowHeight = IMAGE_GRID_CONFIG.ESTIMATED_ROW_HEIGHT

  // 虚拟滚动器
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
    enabled: images.length > IMAGE_GRID_CONFIG.VIRTUALIZATION_THRESHOLD,
  })

  // 监听容器宽度变化
  useEffect(() => {
    const parent = parentRef.current
    if (!parent) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })

    resizeObserver.observe(parent)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 图片点击处理
  const handleImageClick = useCallback((image: ImageFile) => {
    if (selectable) {
      onSelect?.(image.id, !selectedIds.has(image.id))
    } else {
      onPreview?.(image)
      setPreviewImage(image)
    }
  }, [selectable, selectedIds, onSelect, onPreview])

  // 当图片数量较少时，直接渲染所有图片
  if (images.length <= 30) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4">
          {images.map((image, index) => (
            <div key={image.id}>
              <ImageCard
                image={image}
                onDelete={onDelete}
                onSelect={onSelect}
                selected={selectedIds.has(image.id)}
                selectable={selectable}
                priority={index < 12}
                onPreview={handleImageClick}
              />
            </div>
          ))}
        </div>

        {/* 图片预览模态框 */}
        {previewImage && (
          <ImagePreview
            image={previewImage}
            images={images}
            onImageChange={onImageChange}
            onClose={() => setPreviewImage(null)}
          />
        )}
      </>
    )
  }

  // 虚拟滚动模式
  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <>
      <div
        ref={parentRef}
        className="overflow-auto scrollbar-thin"
        style={{
          contain: 'strict',
          height: `calc(100vh - ${IMAGE_GRID_CONFIG.HEADER_HEIGHT}px)`,
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualRow) => {
            const startIndex = virtualRow.index * columns
            const endIndex = Math.min(startIndex + columns, images.length)
            const rowImages = images.slice(startIndex, endIndex)

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-4"
              >
                {rowImages.map((image) => (
                  <div key={image.id}>
                    <ImageCard
                      image={image}
                      onDelete={onDelete}
                      onSelect={onSelect}
                      selected={selectedIds.has(image.id)}
                      selectable={selectable}
                      priority={false}
                      onPreview={handleImageClick}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* 图片预览模态框 */}
      {previewImage && (
        <ImagePreview
          image={previewImage}
          images={images}
          onImageChange={onImageChange}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </>
  )
}

/**
 * 决定是否使用虚拟列表
 * 当图片数量 > VIRTUALIZATION_THRESHOLD 时启用
 */
export function shouldVirtualize(imagesCount: number): boolean {
  return imagesCount > IMAGE_GRID_CONFIG.VIRTUALIZATION_THRESHOLD
}
