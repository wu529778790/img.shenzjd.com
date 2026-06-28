import imageCompression, { Options } from 'browser-image-compression'

export interface CompressionOptions extends Partial<Options> {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: 'image/jpeg' | 'image/png' | 'image/webp'
  initialQuality?: number
}

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const defaultOptions: Options = {
    maxSizeMB: options.maxSizeMB ?? 1,
    maxWidthOrHeight: options.maxWidthOrHeight ?? 1920,
    useWebWorker: options.useWebWorker ?? true,
    fileType: options.fileType ?? 'image/jpeg',
    initialQuality: options.initialQuality ?? 0.8,
  }

  try {
    console.log(`Compressing ${file.name}...`)
    const compressedFile = await imageCompression(file, defaultOptions)

    const savings = ((file.size - compressedFile.size) / file.size) * 100
    console.log(`Compressed ${file.name}: ${file.size} → ${compressedFile.size} (${savings.toFixed(1)}% reduction)`)

    return compressedFile
  } catch (error) {
    console.error('Compression failed:', error)
    throw error
  }
}
