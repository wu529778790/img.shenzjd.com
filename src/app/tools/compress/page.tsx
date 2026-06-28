'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { compressImage } from '@/lib/compress'
import { formatFileSize } from '@/lib/utils'

export default function CompressPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [compressing, setCompressing] = useState(false)
  const [quality, setQuality] = useState([80])
  const [originalPreview, setOriginalPreview] = useState<string | null>(null)
  const [compressedPreview, setCompressedPreview] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setOriginalFile(file)
      setCompressedFile(null)

      // 生成预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setOriginalPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    multiple: false,
  })

  const handleCompress = async () => {
    if (!originalFile) return

    setCompressing(true)
    try {
      const compressed = await compressImage(originalFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        initialQuality: quality[0] / 100,
        fileType: 'image/jpeg',
      })

      setCompressedFile(compressed)

      // 生成压缩后预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setCompressedPreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)

      const savings = ((originalFile.size - compressed.size) / originalFile.size * 100).toFixed(1)
      toast.success(`压缩完成，减小了 ${savings}%`)
    } catch (error) {
      console.error('Compression failed:', error)
      toast.error('压缩失败')
    } finally {
      setCompressing(false)
    }
  }

  const handleDownload = () => {
    if (!compressedFile) return

    const url = URL.createObjectURL(compressedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = `compressed-${originalFile?.name || 'image.jpg'}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('开始下载')
  }

  const handleReset = () => {
    setOriginalFile(null)
    setCompressedFile(null)
    setOriginalPreview(null)
    setCompressedPreview(null)
    setQuality([80])
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          图片压缩
        </h1>
        <p className="text-gray-500 mt-2">压缩图片大小，保持高质量</p>
      </div>

      {!originalFile ? (
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
              支持 PNG、JPG、GIF、WebP 格式
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 压缩设置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">压缩设置</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quality">
                  压缩质量: {quality[0]}%
                </Label>
                <Slider
                  id="quality"
                  min={10}
                  max={100}
                  step={10}
                  value={quality}
                  onValueChange={(value) => setQuality(value as number[])}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>更小文件</span>
                  <span>更高质量</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleCompress}
                disabled={compressing}
                className="flex-1"
              >
                {compressing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    压缩中...
                  </>
                ) : (
                  '开始压缩'
                )}
              </Button>
              <Button onClick={handleReset} variant="outline">
                重新选择
              </Button>
            </div>
          </Card>

          {/* 压缩对比 */}
          {originalPreview && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 原图 */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">原图</h3>
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    src={originalPreview}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formatFileSize(originalFile.size)}
                </p>
              </Card>

              {/* 压缩后 */}
              {compressedPreview ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">压缩后</h3>
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <img
                      src={compressedPreview}
                      alt="Compressed"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      {formatFileSize(compressedFile!.size)}
                    </p>
                    <Button
                      size="sm"
                      onClick={handleDownload}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      下载
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-4 flex items-center justify-center">
                  <p className="text-gray-500">点击"开始压缩"查看结果</p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
