'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateLink } from '@/lib/link'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { toast } from 'sonner'
import type { ImageFile } from '@/types/image'

interface ImagePreviewProps {
  image: ImageFile
  onClose: () => void
}

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  const { token } = useAuthStore()
  const configStore = useConfigStore()

  // ESC 键关闭
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleCopyLink = async (format: 'markdown' | 'html' | 'bbcode') => {
    const { owner, repo, branch } = configStore

    const link = generateLink({
      format,
      cdn: 'github',
      owner,
      repo,
      branch,
      path: image.path,
      fileName: image.name,
      useRaw: true,
    })

    try {
      await navigator.clipboard.writeText(link)
      toast.success('链接已复制')
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.download_url
    link.download = image.name
    link.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">{image.name}</h3>
            <p className="text-sm text-gray-500">
              {(image.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              下载
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 图片 */}
        <div className="relative aspect-video bg-gray-100 dark:bg-gray-800">
          <Image
            src={image.download_url}
            alt={image.name}
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* 底部工具栏 */}
        <div className="p-4 border-t flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyLink('markdown')}
          >
            复制 Markdown
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyLink('html')}
          >
            复制 HTML
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCopyLink('bbcode')}
          >
            复制 BBCode
          </Button>
        </div>
      </div>
    </div>
  )
}
