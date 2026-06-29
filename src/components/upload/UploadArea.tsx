'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadArea({ onFilesSelected, disabled }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        setIsProcessing(true)
        // 短暂延迟以显示处理状态
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

  const handleClick = useCallback(() => {
    if (disabled) return

    // 添加点击反馈
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
        'relative min-h-[120px] min-w-[44px]',  // 确保最小触摸目标 44px
        'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer',
        'transition-all duration-200 ease-[var(--easing-default)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragActive || isDragging
          ? 'border-primary bg-primary/5 shadow-soft-lg scale-[1.01]'
          : 'border-gray-300 dark:border-gray-600 hover:border-primary hover:shadow-soft-md',
        disabled && 'opacity-50 cursor-not-allowed',
        isClicking && 'scale-[0.98]'  // 点击反馈
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="上传图片区域，拖拽图片到此处或点击选择文件"
      aria-describedby="upload-help-text"
    >
      <input {...getInputProps()} disabled={disabled} />

      {/* 处理中遮罩 */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">处理中...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center">
        {isDragActive ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold">松开以上传</p>
            <p className="text-sm text-muted-foreground mt-2">释放鼠标或手指完成上传</p>
          </>
        ) : (
          <>
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <p className="mt-4 text-lg font-medium text-foreground">拖拽图片到此处，或点击选择文件</p>
            <p id="upload-help-text" className="text-sm text-muted-foreground mt-2">
              支持 PNG、JPG、JPEG、GIF、WEBP 格式，单文件最大 10MB
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={disabled}
              aria-label="选择图片文件"
            >
              选择图片
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
