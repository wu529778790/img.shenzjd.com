export interface WatermarkOptions {
  text: string
  color?: string
  size?: number
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export async function addWatermark(
  file: File,
  options: WatermarkOptions
): Promise<Blob> {
  const {
    text,
    color = '#ffffff',
    size = 24,
    position = 'bottom-right',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    img.onload = () => {
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

      // 转换为 Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/jpeg',
        0.9
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}
