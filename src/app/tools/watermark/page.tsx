'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Download, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import { addWatermark } from '@/lib/watermark'
import { formatFileSize } from '@/lib/utils'
import { debugError } from '@/lib/debug'
import Image from 'next/image'

export default function WatermarkPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [watermarkedFile, setWatermarkedFile] = useState<Blob | null>(null)
  const [processing, setProcessing] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [watermarkedPreview, setWatermarkedPreview] = useState<string | null>(null)

  // 水印设置
  const [watermarkText, setWatermarkText] = useState('ImgX')
  const [watermarkColor, setWatermarkColor] = useState('#ffffff')
  const [watermarkSize, setWatermarkSize] = useState([24])
  const [watermarkPosition, setWatermarkPosition] = useState<
    'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  >('bottom-right')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setOriginalFile(file)
      setWatermarkedFile(null)
      setWatermarkedPreview(null)

      // 生成预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
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

  const handleAddWatermark = async () => {
    if (!originalFile || !watermarkText) {
      toast.error('请输入水印文字')
      return
    }

    setProcessing(true)
    try {
      const watermarked = await addWatermark(originalFile, {
        text: watermarkText,
        color: watermarkColor,
        size: watermarkSize[0],
        position: watermarkPosition,
      })

      setWatermarkedFile(watermarked)

      // 生成预览
      const reader = new FileReader()
      reader.onloadend = () => {
        setWatermarkedPreview(reader.result as string)
      }
      reader.readAsDataURL(watermarked)

      toast.success('水印添加成功')
    } catch (error) {
      debugError('Watermark failed:', error)
      toast.error('水印添加失败')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!watermarkedFile) return

    const url = URL.createObjectURL(watermarkedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = `watermarked-${originalFile?.name || 'image.jpg'}`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('开始下载')
  }

  const handleReset = () => {
    setOriginalFile(null)
    setWatermarkedFile(null)
    setPreview(null)
    setWatermarkedPreview(null)
    setWatermarkText('ImgX')
    setWatermarkColor('#ffffff')
    setWatermarkSize([24])
    setWatermarkPosition('bottom-right')
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ImageIcon className="h-8 w-8" />
          水印工具
        </h1>
        <p className="text-gray-500 mt-2">为图片添加文字水印</p>
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
          {/* 水印设置 */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">水印设置</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="text">水印文字</Label>
                <Input
                  id="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="ImgX"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="color">颜色</Label>
                <div className="flex gap-2 mt-1">
                  <input
                    id="color"
                    type="color"
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                    className="h-10 w-20 rounded cursor-pointer"
                  />
                  <Input
                    value={watermarkColor}
                    onChange={(e) => setWatermarkColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="size">
                  大小: {watermarkSize[0]}px
                </Label>
                <Slider
                  id="size"
                  min={12}
                  max={72}
                  step={2}
                  value={watermarkSize}
                  onValueChange={(value) => setWatermarkSize(value as number[])}
                  className="mt-2"
                />
              </div>

              <div>
                <Label>位置</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map(
                    (pos) => (
                      <Button
                        key={pos}
                        variant={watermarkPosition === pos ? 'default' : 'outline'}
                        onClick={() => setWatermarkPosition(pos)}
                        className="text-sm"
                      >
                        {pos === 'top-left' && '左上'}
                        {pos === 'top-right' && '右上'}
                        {pos === 'bottom-left' && '左下'}
                        {pos === 'bottom-right' && '右下'}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={handleAddWatermark}
                disabled={processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '添加水印'
                )}
              </Button>
              <Button onClick={handleReset} variant="outline">
                重新选择
              </Button>
            </div>
          </Card>

          {/* 预览对比 */}
          {preview && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* 原图 */}
              <Card className="p-4">
                <h3 className="font-semibold mb-2">原图</h3>
                <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  <Image
                    src={preview}
                    alt="Original"
                    width={800}
                    height={600}
                    className="w-full h-full object-contain"
                    unoptimized // Preview images don't need optimization
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {formatFileSize(originalFile.size)}
                </p>
              </Card>

              {/* 加水印后 */}
              {watermarkedPreview ? (
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">水印效果</h3>
                  <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <Image
                      src={watermarkedPreview}
                      alt="Watermarked"
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                      unoptimized // Preview images don't need optimization
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-500">
                      {watermarkedFile && formatFileSize(watermarkedFile.size)}
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
                  <p className="text-gray-500">点击"添加水印"查看效果</p>
                </Card>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
