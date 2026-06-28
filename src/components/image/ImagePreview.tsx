'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { X, Download, Copy, Check, ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generateLink } from '@/lib/link'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { toast } from 'sonner'
import type { ImageFile } from '@/types/image'
import { motion, AnimatePresence } from 'framer-motion'

interface ImagePreviewProps {
  image: ImageFile
  onClose: () => void
}

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const configStore = useConfigStore()
  const { addLog: addOperationLog } = useOperationLogStore()

  const modalRef = useRef<HTMLDivElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)

  // ESC 键关闭 + Focus Trap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    // Focus trap: 焦点保持在 modal 内
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    window.addEventListener('keydown', handleEscape)
    window.addEventListener('keydown', handleTab)

    // 保存之前的焦点
    const previousActiveElement = document.activeElement as HTMLElement
    // 聚焦到 modal
    modalRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', handleEscape)
      window.removeEventListener('keydown', handleTab)
      // 恢复焦点
      previousActiveElement?.focus()
    }
  }, [onClose])

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
      setCopiedFormat(format)
      toast.success(`${format.toUpperCase()} 链接已复制`)
      addOperationLog({
        type: 'copy',
        action: '复制链接',
        status: 'success',
        detail: `${format}: ${link}`,
      })
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = image.download_url
    link.download = image.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    addOperationLog({
      type: 'download',
      action: '下载图片',
      status: 'success',
      detail: image.name,
    })
  }

  const handleOpenInNewTab = () => {
    window.open(image.download_url, '_blank', 'noopener,noreferrer')
    addOperationLog({
      type: 'view',
      action: '新标签页查看',
      status: 'success',
      detail: image.name,
    })
  }

  // 格式化文件大小
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
      >
        {/* 主容器 */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        >
          {/* 顶部工具栏 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* 左侧：图片信息 */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {image.name}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatFileSize(image.size)}</span>
                  {image.width && image.height && (
                    <>
                      <span>·</span>
                      <span>
                        {image.width} × {image.height}
                      </span>
                    </>
                  )}
                  {image.uploaded_at && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(image.uploaded_at).toLocaleDateString('zh-CN')}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：操作按钮 */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleOpenInNewTab}
                  className="h-9 px-3"
                  aria-label="在新标签页打开"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDownload}
                  className="h-9 px-3"
                  aria-label="下载图片"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">下载</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClose}
                  className="h-9 w-9 p-0"
                  aria-label="关闭预览"
                >
                  <X className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>

          {/* 图片区域 */}
          <div className="flex-1 relative min-h-0 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center overflow-hidden">
            {/* 加载占位符 */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 animate-pulse">
                <div className="text-gray-400 dark:text-gray-600">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            )}

            {/* 实际图片 */}
            <Image
              src={image.cdnUrl || image.download_url}
              alt={image.name}
              fill
              className={cn(
                "object-contain transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              priority
              quality={85}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            />
          </div>

          {/* 底部工具栏：复制链接 */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                复制链接:
              </span>
              <div className="flex gap-2 flex-wrap">
                {[
                  { format: 'url' as const, label: 'URL' },
                  { format: 'markdown' as const, label: 'Markdown' },
                  { format: 'html' as const, label: 'HTML' },
                  { format: 'bbcode' as const, label: 'BBCode' },
                ].map(({ format, label }) => (
                  <motion.div
                    key={format}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      size="sm"
                      variant={copiedFormat === format ? 'default' : 'outline'}
                      onClick={() => handleCopyLink(format)}
                      className={cn(
                        "h-8 px-3 text-sm font-medium transition-all gap-1.5",
                        copiedFormat === format && "bg-green-600 hover:bg-green-700 text-white border-green-600"
                      )}
                      disabled={copiedFormat !== null}
                    >
                      {copiedFormat === format ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
