'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadArea({ onFilesSelected, disabled }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsProcessing(true)
        setTimeout(() => {
          onFilesSelected(acceptedFiles)
          setIsProcessing(false)
        }, 150) // 优化：延长处理时间，确保反馈可见（>100ms）
      }
    },
    [onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: true,
    disabled,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  })

  // 粘贴上传：监听全局粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return

      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        setIsProcessing(true)
        setPasteFlash(true)
        setTimeout(() => setPasteFlash(false), 600) // 优化：延长闪光效果持续时间
        setTimeout(() => {
          onFilesSelected(imageFiles)
          setIsProcessing(false)
          toast.success(`已粘贴 ${imageFiles.length} 张图片`)
        }, 150) // 优化：延长处理延迟
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [disabled, onFilesSelected])

  const handleClick = useCallback(() => {
    if (disabled) return

    setIsClicking(true)
    setTimeout(() => setIsClicking(false), 200) // 优化：延长点击反馈时间

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    input?.click()
  }, [disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
    if (e.key === 'Escape' && isDragging) {
      setIsDragging(false)
    }
  }, [handleClick, isDragging])

  return (
    <div
      {...getRootProps()}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative min-h-[320px]',
        'border-2 border-dashed rounded-2xl px-8 py-14 text-center cursor-pointer',
        'transition-all duration-200 ease-[var(--easing-default)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        // 优化：增强拖拽状态的视觉反馈
        isDragActive || isDragging
          ? 'border-primary bg-primary/[0.06] shadow-lg scale-[1.01] border-solid'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary/60 hover:bg-primary/[0.03] active:bg-primary/[0.05]',
        // 优化：改进禁用状态（0.38-0.5 透明度）
        disabled && 'opacity-[0.38] cursor-not-allowed hover:border-gray-300 dark:hover:border-gray-600 hover:bg-transparent',
        // 优化：改进点击反馈（更明显）
        isClicking && 'scale-[0.98]',
        pasteFlash && 'border-green-500 bg-green-50 dark:bg-green-950/30 scale-[1.01] shadow-md',
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="上传图片区域，拖拽图片到此处或点击选择文件"
      aria-describedby="upload-help-text"
      // 优化：添加 touch-action 减少移动端延迟
      style={{ touchAction: 'manipulation' }}
    >
      <input {...getInputProps()} disabled={disabled} />

      {/* 处理中遮罩 */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-2xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">处理中...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        {isDragActive ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-colors">
              <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-foreground">松开以上传</p>
            <p className="text-sm text-muted-foreground mt-1.5">释放鼠标或手指完成上传</p>
          </>
        ) : (
          <>
            {/* 优化：图标组合 - 统一尺寸和样式 */}
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-200 hover:bg-primary/15 mb-6">
              <ImageIcon className="h-10 w-10 text-primary" aria-hidden="true" />
            </div>

            {/* 优化：改进文案层级和对比度 */}
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              拖拽图片到此处，或点击选择文件
            </p>
            <p id="upload-help-text" className="text-base text-gray-600 dark:text-gray-400 mt-3">
              支持 PNG、JPG、JPEG、GIF、WEBP 格式
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2 flex items-center justify-center gap-2">
              <span>单文件最大 10MB</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" aria-hidden="true" />
              <span>支持批量上传</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" aria-hidden="true" />
              <span>也可以直接 Ctrl+V / Cmd+V 粘贴</span>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
