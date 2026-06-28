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

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles)
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

  const handleClick = () => {
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    input?.click()
  }

  return (
    <div
      {...getRootProps()}
      onClick={handleClick}
      className={cn(
        'border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors',
        isDragActive || isDragging
          ? 'border-primary bg-primary/5'
          : 'border-gray-300 hover:border-primary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} disabled={disabled} />

      <div className="flex flex-col items-center">
        {isDragActive ? (
          <>
            <Upload className="mx-auto h-12 w-12 text-primary animate-bounce" />
            <p className="mt-4 text-lg font-semibold">松开以上传</p>
          </>
        ) : (
          <>
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-lg">拖拽图片到此处，或点击选择文件</p>
            <p className="text-sm text-gray-500 mt-2">
              支持 PNG、JPG、GIF、WebP 格式
            </p>
            <Button
              type="button"
              className="mt-4"
              disabled={disabled}
            >
              选择图片
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
