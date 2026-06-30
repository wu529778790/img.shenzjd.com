import imageCompression, { Options } from 'browser-image-compression'
import { debugLog, debugError } from './debug'

export interface CompressionOptions extends Partial<Options> {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  initialQuality?: number
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
