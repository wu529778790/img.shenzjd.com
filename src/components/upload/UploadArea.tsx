'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon, ClipboardPaste } from 'lucide-react'
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
        }, 100)
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
        setTimeout(() => setPasteFlash(false), 400)
        setTimeout(() => {
          onFilesSelected(imageFiles)
          setIsProcessing(false)
          toast.success(`已粘贴 ${imageFiles.length} 张图片`)
        }, 100)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [disabled, onFilesSelected])

  const handleClick = useCallback(() => {
    if (disabled) return

    setIsClicking(true)
    setTimeout(() => setIsClicking(false), 150)

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
        'relative min-h-[200px]',
        'border-2 border-dashed rounded-2xl px-6 py-10 text-center cursor-pointer',
        'transition-all duration-200 ease-[var(--easing-default)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragActive || isDragging
          ? 'border-primary bg-primary/[0.04] shadow-soft-lg scale-[1.01]'
          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-primary/[0.02]',
        disabled && 'opacity-50 cursor-not-allowed',
        isClicking && 'scale-[0.99]',
        pasteFlash && 'border-green-500 bg-green-50 dark:bg-green-950/30 scale-[1.01]',
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="上传图片区域，拖拽图片到此处或点击选择文件"
      aria-describedby="upload-help-text"
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-foreground">松开以上传</p>
            <p className="text-sm text-muted-foreground mt-1.5">释放鼠标或手指完成上传</p>
          </>
        ) : (
          <>
            {/* 图标组合 - 放在视觉容器中 */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800/80 flex items-center justify-center">
                <ClipboardPaste className="h-4 w-4 text-gray-400 dark:text-gray-600" aria-hidden="true" />
              </div>
            </div>
            <p className="text-base font-medium text-foreground">拖拽图片到此处，或点击选择文件</p>
            <p id="upload-help-text" className="text-sm text-muted-foreground mt-2">
              支持 PNG、JPG、JPEG、GIF、WEBP 格式，单文件最大 10MB
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1.5">
              也可以直接 Ctrl+V / Cmd+V 粘贴截图
            </p>
          </>
        )}
      </div>
    </div>
  )
}
