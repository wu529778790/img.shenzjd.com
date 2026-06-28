'use client'

import { useState, memo } from 'react'
import Image from 'next/image'
import { MoreVertical, Trash2, Link2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { generateLink } from '@/lib/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { toast } from 'sonner'
import { ImageCardDeleteConfirm } from './ImageCardDeleteConfirm'
import type { ImageFile } from '@/types/image'

// 极小尺寸的 1×1 透明像素，用作 unoptimized 图片的 blur placeholder（< 100B）
const TINY_BLUR_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='

interface ImageCardProps {
  image: ImageFile
  onDelete?: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  selected?: boolean
  selectable?: boolean
  priority?: boolean
  onPreview?: (image: ImageFile) => void
}

export const ImageCard = memo(function ImageCard({ image, onDelete, onSelect, selected, selectable, priority, onPreview }: ImageCardProps) {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const configStore = useConfigStore()
  const { addLog: addOperationLog } = useOperationLogStore()

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleCopyLink = async (format: 'markdown' | 'html' | 'bbcode' | 'url') => {
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
      addOperationLog({
        type: 'copy',
        action: '复制链接',
        status: 'success',
        detail: `${formatNames[format]}: ${link}`,
      })
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <>
      {/* 图片卡片 - 简化动画，只保留必要的hover效果 */}
      <div
        className={`
          group relative overflow-hidden rounded-xl
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          shadow-sm hover:shadow-md
          transition-all duration-200 ease-out
          cursor-pointer
          ${selected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}
        `}
        onClick={() => {
          if (selectable) {
            onSelect?.(image.id, !selected)
          } else {
            onPreview?.(image)
          }
        }}
      >
        {/* 图片预览区域 */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-900">
          <Image
            src={image.cdnUrl || image.download_url}
            alt={image.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            unoptimized={!!image.cdnUrl}
            placeholder="blur"
            blurDataURL={TINY_BLUR_B64}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />

          {/* 选中状态指示器 */}
          <div
            className="absolute top-3 right-3 transition-all duration-200"
            style={{
              transform: selected ? 'scale(1)' : 'scale(0)',
              opacity: selected ? 1 : 0,
            }}
          >
            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
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
                className="h-8 w-8 p-0 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={(e) => e.stopPropagation()}
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
                  onClick={() => setShowDeleteConfirm(true)}
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
        token={token}
        owner={configStore.owner}
        repo={configStore.repo}
        onDeleted={onDelete ?? (() => {})}
      />

    </>
  )
})
