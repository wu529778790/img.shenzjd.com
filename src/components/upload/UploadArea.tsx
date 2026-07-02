'use client'

import { useCallback, useState, useEffect, useMemo } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ALLOWED_EXTENSIONS,
  MIME_BY_EXT,
  isImage as isImageFile,
  isVideo,
  isAudio,
  matchesAllowedExtensions,
} from '@/lib/fileTypes'

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  disabled?: boolean
}

export function UploadArea({ onFilesSelected, disabled }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pasteFlash, setPasteFlash] = useState(false)

  // 内置白名单 — 图片/视频/音频/文档/压缩包统一支持。
  // react-dropzone 的 accept 映射：未知扩展名用真实 MIME，否则浏览器会报 "Skipped" 警告。
  const acceptMap = useMemo(() => {
    const map: Record<string, string[]> = {}

    const push = (mime: string, ext: string) => {
      ;(map[mime] ??= []).push(ext)
    }

    ALLOWED_EXTENSIONS.forEach((ext) => {
      if (isImageFile(`x${ext}`)) push('image/*', ext)
      else if (isVideo(`x${ext}`)) push('video/*', ext)
      else if (isAudio(`x${ext}`)) push('audio/*', ext)
      else push(MIME_BY_EXT[ext] ?? 'application/octet-stream', ext)
    })

    return map
  }, [])

  const helpText = useMemo(
    () => `支持 ${ALLOWED_EXTENSIONS.map((e) => e.replace('.', '').toUpperCase()).join('、')} 格式`,
    []
  )

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
    accept: acceptMap,
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

      const clipboardFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind !== 'file') continue
        const file = items[i].getAsFile()
        if (file && matchesAllowedExtensions(file.name, ALLOWED_EXTENSIONS)) {
          clipboardFiles.push(file)
        }
      }

      if (clipboardFiles.length > 0) {
        e.preventDefault()
        setIsProcessing(true)
        setPasteFlash(true)
        setTimeout(() => setPasteFlash(false), 600) // 优化：延长闪光效果持续时间
        setTimeout(() => {
          onFilesSelected(clipboardFiles)
          setIsProcessing(false)
          toast.success(`已粘贴 ${clipboardFiles.length} 个文件`)
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
        'relative min-h-[220px]',
        'border-2 border-dashed rounded-2xl px-6 py-12 text-center cursor-pointer',
        'transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isDragActive || isDragging
          ? 'border-primary bg-primary/[0.06] shadow-lg scale-[1.01] border-solid'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/[0.02]',
        disabled && 'opacity-40 cursor-not-allowed',
        isClicking && 'scale-[0.98]',
        pasteFlash && 'border-green-500 bg-green-50 dark:bg-green-950/30 scale-[1.01] shadow-md',
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="上传区域，拖拽文件到此处或点击选择文件"
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
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center transition-all duration-200 hover:bg-primary/15 mb-5">
              <ImageIcon className="h-8 w-8 text-primary" aria-hidden="true" />
            </div>

            {/* 优化：改进文案层级和对比度 */}
            <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
              拖拽文件到此处，或点击选择文件
            </p>
            <p id="upload-help-text" className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {helpText}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 flex items-center justify-center gap-2">
              <span>单文件最大 100MB</span>
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
