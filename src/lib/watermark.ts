export interface WatermarkOptions {
  text: string
  color?: string
  size?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  useWorker?: boolean
  fileType?: string
}

import { debugWarn } from './debug'

/**
 * 添加水印（主线程版本 - 保留作为回退）
 */
export async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  if (options.useWorker !== false) {
    try {
      return await addWatermarkWithWorker(file, options)
    } catch (error) {
      debugWarn('Worker failed, falling back to main thread:', error)
    }
  }

  const {
    text,
    color = '#ffffff',
    size = 24,
    position = 'bottom-right',
    fileType = file.type,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
      // ✅ 释放 ObjectURL 防止内存泄漏
      URL.revokeObjectURL(img.src)

      canvas.width = img.width
      canvas.height = img.height

      // 绘制原图
      ctx.drawImage(img, 0, 0)

      // 配置文字
      ctx.font = `bold ${size}px Arial`
      ctx.fillStyle = color
      ctx.textBaseline = 'middle'

      // 计算位置
      const padding = 20
      const textMetrics = ctx.measureText(text)
      const textWidth = textMetrics.width
      const textHeight = size

      let x: number, y: number

      switch (position) {
        case 'top-left':
          x = padding
          y = padding + textHeight / 2
          break
        case 'top-right':
          x = canvas.width - textWidth - padding
          y = padding + textHeight / 2
          break
        case 'bottom-left':
          x = padding
          y = canvas.height - padding - textHeight / 2
          break
        case 'bottom-right':
          x = canvas.width - textWidth - padding
          y = canvas.height - padding - textHeight / 2
          break
      }

      // 绘制阴影（增强可读性）
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.shadowBlur = 4
      ctx.shadowOffsetX = 2
      ctx.shadowOffsetY = 2

      // 绘制文字
      ctx.fillText(text, x, y)

      // 转换为 Blob（保留原图格式）
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        fileType,
        0.9
      )
    }

    img.onerror = () => {
      // ✅ 即使失败也要释放 ObjectURL
      URL.revokeObjectURL(img.src)
      reject(new Error('Failed to load image'))
    }
    img.src = URL.createObjectURL(file)
  })
}

/**
 * 使用 Web Worker 处理水印（不阻塞主线程）
 */
async function addWatermarkWithWorker(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/watermark.worker.ts', {
      type: 'module',
    })

    const timeout = setTimeout(() => {
      worker.terminate()
      reject(new Error('Watermark processing timeout'))
    }, 30000)

    worker.onmessage = (e: MessageEvent) => {
      const { type, blob, error } = e.data

      if (type === 'success' && blob) {
        clearTimeout(timeout)
        worker.terminate()
        resolve(blob)
      } else if (type === 'error') {
        clearTimeout(timeout)
        worker.terminate()
        reject(new Error(error || 'Watermark processing failed'))
      }
    }

    worker.onerror = (error) => {
      clearTimeout(timeout)
      worker.terminate()
      reject(new Error(`Worker error: ${error.message}`))
    }

    worker.postMessage({
      type: 'watermark',
      file,
      options: {
        ...options,
        fileType: options.fileType || file.type,
      },
    })
  })
}

