'use client'

import { Eye } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageGridListViewProps {
  images: ImageFile[]
  selectedIds: Set<string>
  onSelect: (id: string, selected: boolean) => void
  selectionMode?: boolean
}

export function ImageGridListView({ images, selectedIds, onSelect, selectionMode = false }: ImageGridListViewProps) {
  return (
    <div className="space-y-2">
      {images.map((image, index) => (
        <div
          key={`${image.id}-${image.path}-${index}`}
          className="flex items-center gap-4 p-4 rounded-xl border-2
            bg-white dark:bg-gray-800
            border-gray-200 dark:border-gray-700
            hover:border-primary/30 dark:hover:border-primary/30
            hover:bg-primary/5 dark:hover:bg-primary/10
            transition-all duration-200 cursor-pointer
            group
            ${selectedIds.has(image.id) ? 'border-primary bg-primary/5 dark:bg-primary/10' : ''}"
          onClick={() => selectionMode && onSelect(image.id, !selectedIds.has(image.id))}
        >
          {selectionMode && (
            <input
              type="checkbox"
              checked={selectedIds.has(image.id)}
              onChange={() => onSelect(image.id, !selectedIds.has(image.id))}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-2 focus:ring-primary focus:ring-offset-0 cursor-pointer transition-all"
              onClick={(e) => e.stopPropagation()}
            />
          )}
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
