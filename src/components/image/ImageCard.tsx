'use client'

import { useState, memo, useCallback, useRef } from 'react'
import Image from 'next/image'
import { MoreVertical, Trash2, Link2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { generateLink } from '@/lib/link'
import { getWebPUrl } from '@/lib/webp'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useConfigStore } from '@/stores/configStore'
import { toast } from 'sonner'
import { ImageCardDeleteConfirm } from './ImageCardDeleteConfirm'
import type { ImageFile } from '@/types/image'

// 图片加载占位符 - 柔和的灰色渐变（小尺寸以减少 base64 长度）
const IMAGE_PLACEHOLDER_B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdACmZ/8QAFBEBAAAAAAAAAAAAAAAAAAAAof/aAAgBAQABBP8H/8QAFBEBAAAAAAAAAAAAAAAAAAAAof/aAAgBAgABPwH/2Q=='

interface ImageCardProps {
  image: ImageFile
  onDelete?: (id: string) => void
  priority?: boolean
  onPreview?: (image: ImageFile) => void
}

/**
 * 自定义比较函数：当 image 的 id、sha 未改变时跳过重渲染
 * CDN URL 是实时计算的，不需要比较
 */
function imageCardAreEqual(prev: { image: ImageFile }, next: { image: ImageFile }): boolean {
  return (
    prev.image.id === next.image.id &&
    prev.image.sha === next.image.sha &&
    prev.image.name === next.image.name &&
    prev.image.path === next.image.path
  )
}

function ImageCardInner({ image, onDelete, priority, onPreview }: ImageCardProps) {
  const configStore = useConfigStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  // 使用 ref 跟踪删除操作状态，防止删除确认关闭时触发预览
  const isDeletingRef = useRef(false)

  // 实时计算 CDN URL，使切换 CDN 立即生效
  const cdnUrl = generateLink({
    format: 'url',
    cdn: configStore.cdn,
    owner: configStore.owner,
    repo: configStore.repo,
    branch: configStore.branch,
    path: image.path,
    fileName: image.name,
    useRaw: configStore.useRaw ?? true,
  })

  // 使用 useCallback 优化函数稳定性
  const handleCopyLink = useCallback(async (format: 'markdown' | 'html' | 'bbcode' | 'url') => {
    const { owner, repo, branch, cdn, useRaw } = configStore

    const link = generateLink({
      format,
      cdn,
      owner,
      repo,
      branch,
      path: image.path,
      fileName: image.name,
      useRaw,
    })

    try {
      await navigator.clipboard.writeText(link)
      const formatNames: Record<string, string> = {
        markdown: 'Markdown',
        html: 'HTML',
        bbcode: 'BBCode',
        url: '链接',
      }
      toast.success(`${formatNames[format]}已复制`)
    } catch {
      toast.error('复制失败')
    }
  }, [configStore, image.path, image.name])

  // 使用 useCallback 优化事件处理函数
  const handleClick = useCallback(() => {
    // 如果正在删除或删除确认框显示中，不触发预览
    if (isDeletingRef.current || showDeleteConfirm) {
      return
    }
    onPreview?.(image)
  }, [image.id, onPreview, showDeleteConfirm])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onPreview?.(image)
    }
  }, [image.id, onPreview])

  return (
    <>
      {/* 图片卡片 - 简化动画，只保留必要的hover效果 */}
      <div
        className={cn(
          'group relative overflow-hidden rounded-xl',
          'bg-white/80 dark:bg-gray-800/80',
          'border border-gray-200/80 dark:border-gray-700/50',
          'shadow-modern-sm hover:shadow-modern-md',
          'backdrop-blur-sm',
          'transition-all duration-200 ease-out',
          'cursor-pointer',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',
        )}
        style={{
          // 优化重绘性能
          contain: 'layout style',
          // 提示浏览器优化过渡动画
          willChange: 'box-shadow, border-color',
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`预览图片: ${image.name}`}
      >
        {/* 图片预览区域 */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Image
            src={getWebPUrl(cdnUrl)}
            alt={image.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            unoptimized={!!image.cdnUrl}
            placeholder="blur"
            blurDataURL={IMAGE_PLACEHOLDER_B64}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            style={{
              // 优化重绘性能
              contain: 'layout style paint',
            }}
          />

        </div>

        {/* 文件信息 */}
        <div className="p-4 space-y-2">
          <p
            className="text-sm font-medium truncate cursor-help"
            title={image.name}
          >
            {image.name}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-mono">
              {formatFileSize(image.size)}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${image.name} 操作菜单`}
              >
                <div className="flex items-center justify-center">
                  <MoreVertical className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleCopyLink('markdown')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  复制 Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyLink('html')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  复制 HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyLink('bbcode')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  复制 BBCode
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyLink('url')}>
                  <Link2 className="mr-2 h-4 w-4" />
                  复制链接
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    // 阻止事件冒泡到卡片，防止触发预览
                    e.stopPropagation()
                    isDeletingRef.current = true
                    setShowDeleteConfirm(true)
                  }}
                  className="text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 单张删除确认弹窗 */}
      <ImageCardDeleteConfirm
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        image={image}
        onConfirm={() => {
          setShowDeleteConfirm(false)
          onDelete?.(image.id)
        }}
      />

    </>
  )
}

export const ImageCard = memo(ImageCardInner, imageCardAreEqual)
