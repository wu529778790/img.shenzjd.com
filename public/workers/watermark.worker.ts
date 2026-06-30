/**
 * Watermark Worker - 在独立线程中处理图片水印
 * 避免阻塞主线程，提升用户体验
 */

interface WatermarkWorkerMessage {
  type: 'watermark'
  file: File
  options: {
    text: string
    color?: string
    size?: number
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    fileType?: string
  }
}

interface WatermarkWorkerResponse {
  type: 'success' | 'error'
  blob?: Blob
  error?: string
}

self.onmessage = async (e: MessageEvent<WatermarkWorkerMessage>) => {
  const { file, options } = e.data

  try {
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // 创建 ImageBitmap
    const blob = new Blob([arrayBuffer], { type: file.type })
    const bitmap = await createImageBitmap(blob)

    // 创建 Canvas
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height)
    const ctx = canvas.getContext('2d')!

    // 绘制原图
    ctx.drawImage(bitmap, 0, 0)

    // 配置水印文字
    const {
      text,
      color = '#ffffff',
      size = 24,
      position = 'bottom-right',
      fileType = file.type,
    } = options

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
    const watermarkedBlob = await canvas.convertToBlob({
      type: fileType,
      quality: 0.9,
    })

    // 清理资源
    bitmap.close()
    // OffscreenCanvas 没有 close() 方法，通过 GC 自动清理

    // 发送结果回主线程
    const response: WatermarkWorkerResponse = {
      type: 'success',
      blob: watermarkedBlob,
    }

    self.postMessage(response, { transfer: [watermarkedBlob] })
  } catch (error: unknown) {
    // 发送错误回主线程
    const response: WatermarkWorkerResponse = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Watermark processing failed',
    }

    self.postMessage(response)
  }
}

// 处理错误
self.onerror = (error: Event | string) => {
  const errorMessage = typeof error === 'string' ? error : (error as ErrorEvent).message || 'Unknown error'
  const response: WatermarkWorkerResponse = {
    type: 'error',
    error: errorMessage,
  }
  self.postMessage(response)
}
