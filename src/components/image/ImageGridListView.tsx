'use client'

import { Eye } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageGridListViewProps {
  images: ImageFile[]
  onPreview?: (image: ImageFile) => void
}

export function ImageGridListView({ images, onPreview }: ImageGridListViewProps) {
  return (
    <div className="space-y-2">
      {images.map((image, index) => (
        <div
          key={`${image.id}-${image.path}-${index}`}
          className={cn(
            'flex items-center gap-4 p-4 rounded-xl border-2',
            'bg-white dark:bg-gray-800',
            'border-gray-200 dark:border-gray-700',
            'hover:border-primary/30 dark:hover:border-primary/30',
            'hover:bg-primary/5 dark:hover:bg-primary/10',
            'transition-all duration-200 cursor-pointer',
            'group'
          )}
          onClick={() => onPreview?.(image)}
        >
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate group-hover:text-primary transition-colors">
              {image.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(image.size)}
            </p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="h-5 w-5 text-primary" />
          </div>
        </div>
      ))}
    </div>
  )
}
