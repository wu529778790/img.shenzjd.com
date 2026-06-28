'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { ImageCard } from '@/components/image/ImageCard'
import type { ImageFile } from '@/types/image'

interface VirtualizedImageGridProps {
  images: ImageFile[]
  onDelete?: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  selectedIds?: Set<string>
  selectable?: boolean
  itemHeight?: number
  overscan?: number
}

/**
 * 虚拟化图片网格组件
 * 只渲染可视区域内的图片，大幅提升长列表性能
 */
export function VirtualizedImageGrid({
  images,
  onDelete,
  onSelect,
  selectedIds = new Set(),
  selectable = false,
  itemHeight = 320, // 卡片高度 + 间距
  overscan = 5, // 上下额外渲染的行数
}: VirtualizedImageGridProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)

  // 响应式列数
  const [columns, setColumns] = useState(4)

  // 监听容器高度变化
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setContainerHeight(entry.contentRect.height)

        // 根据宽度计算列数
        if (width < 640) {
          setColumns(2) // mobile
        } else if (width < 768) {
          setColumns(2) // small tablet
        } else if (width < 1024) {
          setColumns(3) // tablet
        } else if (width < 1280) {
          setColumns(4) // desktop
        } else if (width < 1536) {
          setColumns(5) // wide
        } else {
          setColumns(6) // ultra-wide
        }
      }
    })

    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // 计算总行数
  const totalRows = Math.ceil(images.length / columns)

  // 计算可视范围
  const { startIndex, endIndex } = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const visibleRowCount = Math.ceil(containerHeight / itemHeight) + overscan * 2
    const endRow = Math.min(totalRows, startRow + visibleRowCount)

    const startIdx = startRow * columns
    const endIdx = Math.min(images.length, endRow * columns)

    return { startIndex: startIdx, endIndex: endIdx }
  }, [scrollTop, containerHeight, totalRows, columns, itemHeight, overscan, images.length])

  // 可视范围内的图片
  const visibleImages = useMemo(() => {
    return images.slice(startIndex, endIndex).map((image, index) => ({
      image,
      globalIndex: startIndex + index,
    }))
  }, [images, startIndex, endIndex])

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  // 总高度
  const totalHeight = totalRows * itemHeight

  // 起始偏移
  const startY = Math.floor(startIndex / columns) * itemHeight

  if (images.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-full scrollbar-thin"
      style={{
        height: containerHeight > 0 ? containerHeight : 'auto',
      }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: startY,
            left: 0,
            right: 0,
          }}
        >
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {visibleImages.map(({ image, globalIndex }) => (
              <motion.div
                key={`${image.id}-${globalIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.2,
                  delay: Math.min((globalIndex % columns) * 0.02, 0.1),  // 优化：20ms 延迟，最大 100ms
                }}
              >
                <ImageCard
                  image={image}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  selected={selectedIds.has(image.id)}
                  selectable={selectable}
                  priority={globalIndex < 10} // 只优先加载前 10 张
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

/**
 * 决定是否使用虚拟列表
 * 当图片数量 > 20 时启用（优化性能）
 */
export function shouldVirtualize(imagesCount: number): boolean {
  return imagesCount > 20
}
