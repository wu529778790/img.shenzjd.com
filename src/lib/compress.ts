import imageCompression, { Options } from 'browser-image-compression'
import { debugLog, debugError } from './debug'

export interface CompressionOptions extends Partial<Options> {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  initialQuality?: number
  fileType?: string
}

/**
 * 压缩图片（默认使用 Web Worker，不阻塞主线程）
 * browser-image-compression 库已内置 Web Worker 支持
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // ✅ 优化默认配置：确保使用 Web Worker
  const defaultOptions: Options = {
    maxSizeMB: options.maxSizeMB ?? 100,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    useWebWorker: options.useWebWorker ?? true,
    initialQuality: options.initialQuality ?? 0.8,
    fileType: options.fileType,
  }

  try {
    debugLog('[Compress] Starting compression for:', file.name, {
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      options: defaultOptions,
    })

    const compressedFile = await imageCompression(file, defaultOptions)

    debugLog('[Compress] Compression completed:', {
      original: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      compressed: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
      ratio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
    })

    return compressedFile
  } catch (error) {
    debugError('[Compress] Compression failed:', error)
    throw error
  }
}

/**
 * 将图片文件转换为 WebP 格式（使用 Canvas）
 * 保留原文件名，仅替换扩展名
 */
export function convertToWebp(file: File, quality = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        URL.revokeObjectURL(url)
        reject(new Error('无法创建 Canvas 上下文'))
        return
      }

      // 白色背景（处理透明 PNG）
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) {
            reject(new Error('WebP 转换失败'))
            return
          }
          const baseName = file.name.replace(/\.[^.]+$/, '')
          const webpFile = new File([blob], `${baseName}.webp`, { type: 'image/webp' })
          debugLog('[WebP] Converted:', file.name, '->', webpFile.name, {
            original: `${(file.size / 1024).toFixed(1)}KB`,
            webp: `${(webpFile.size / 1024).toFixed(1)}KB`,
            ratio: `${((1 - webpFile.size / file.size) * 100).toFixed(1)}%`,
          })
          resolve(webpFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}
