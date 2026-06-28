'use client'

import { useMemo } from 'react'
import { HardDrive, Images } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageStatsProps {
  images: ImageFile[]
}

export function ImageStats({ images }: ImageStatsProps) {
  const stats = useMemo(() => {
    if (images.length === 0) return null

    const totalCount = images.length
    const totalSize = images.reduce((sum, img) => sum + img.size, 0)

    return {
      totalCount,
      totalSize,
    }
  }, [images])

  if (!stats) return null

  return (
    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center gap-1.5">
        <Images className="h-4 w-4" />
        <span>{stats.totalCount} 张</span>
      </div>
      <div className="flex items-center gap-1.5">
        <HardDrive className="h-4 w-4" />
        <span>{formatFileSize(stats.totalSize)}</span>
      </div>
    </div>
  )
}
