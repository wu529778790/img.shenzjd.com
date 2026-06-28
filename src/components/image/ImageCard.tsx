'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FileImage, MoreVertical, Trash2, Link2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { generateLink } from '@/lib/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { toast } from 'sonner'
import { ImagePreview } from './ImagePreview'
import type { ImageFile } from '@/types/image'

interface ImageCardProps {
  image: ImageFile
  onDelete?: (id: string) => void
  onSelect?: (id: string, selected: boolean) => void
  selected?: boolean
  selectable?: boolean
}

export function ImageCard({ image, onDelete, onSelect, selected, selectable }: ImageCardProps) {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ''
  const configStore = useConfigStore()

  const [showPreview, setShowPreview] = useState(false)

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
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleDelete = async () => {
    if (!token || !onDelete) return

    if (!confirm(`确定要删除 ${image.name} 吗？`)) return

    try {
      const response = await fetch(`/api/images/${image.sha}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          owner: configStore.owner,
          repo: configStore.repo,
        }),
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      toast.success('删除成功')
      onDelete(image.id)
    } catch (error) {
      toast.error('删除失败')
      console.error('Delete error:', error)
    }
  }

  return (
    <>
      <div
        className={`group relative border rounded-lg overflow-hidden bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow ${
          selected ? 'ring-2 ring-primary' : ''
        }`}
        onClick={() => selectable && onSelect?.(image.id, !selected)}
      >
        {/* 图片预览 */}
        <div
          className="aspect-square relative cursor-pointer bg-gray-100 dark:bg-gray-900"
          onClick={() => setShowPreview(true)}
        >
          <Image
            src={image.download_url}
            alt={image.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />

          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation()
                setShowPreview(true)
              }}
            >
              <FileImage className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 文件信息 */}
        <div className="p-3">
          <p className="text-sm font-medium truncate" title={image.name}>
            {image.name}
          </p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {formatFileSize(image.size)}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
                  onClick={handleDelete}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* 图片预览模态框 */}
      {showPreview && (
        <ImagePreview
          image={image}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}
