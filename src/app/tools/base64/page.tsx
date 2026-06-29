'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Copy, Check, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import Image from 'next/image'

export default function Base64Page() {
  const [file, setFile] = useState<File | null>(null)
  const [base64, setBase64] = useState<string>('')
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setFile(file)

      // 转换为 Base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setBase64(result)
        setPreview(result)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'],
    },
    multiple: false,
  })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(base64)
      setCopied(true)
      toast.success('已复制到剪贴板')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  const handleReset = () => {
    setFile(null)
    setBase64('')
    setPreview(null)
    setCopied(false)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          Base64 转换
        </h1>
        <p className="text-gray-500 mt-2">将图片转换为 Base64 编码</p>
      </div>

      {!file ? (
        <Card className="p-8">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg">
              {isDragActive ? '松开以上传' : '拖拽图片到此处，或点击选择文件'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              支持 PNG、JPG、GIF、WebP、SVG 格式
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 图片预览 */}
          {preview && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">图片预览</h2>
              <div className="flex justify-center">
                <div className="relative max-h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={preview}
                    alt="Preview"
                    width={800}
                    height={600}
                    className="max-h-96 object-contain"
                    unoptimized // Base64 images don't need optimization
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center mt-2">
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            </Card>
          )}

          {/* Base64 结果 */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Base64 编码</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset}>
                  重新选择
                </Button>
              </div>
            </div>

            <Textarea
              value={base64}
              readOnly
              className="font-mono text-xs min-h-[300px]"
              placeholder="Base64 编码将显示在这里..."
            />

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>共 {base64.length} 个字符</span>
              <span>{(base64.length / 1024).toFixed(1)} KB</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
