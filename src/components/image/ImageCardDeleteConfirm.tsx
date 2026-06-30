'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageCardDeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: ImageFile
  /** 确认删除的回调（由父组件提供具体的删除逻辑） */
  onConfirm: () => void
}

export function ImageCardDeleteConfirm({
  open,
  onOpenChange,
  image,
  onConfirm,
}: ImageCardDeleteConfirmProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">确认删除</DialogTitle>
              <DialogDescription className="mt-1">
                此操作无法撤销，删除后链接将失效
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="truncate font-mono text-gray-600 dark:text-gray-400">{image.name}</span>
            <span className="text-gray-400 text-xs">{formatFileSize(image.size)}</span>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
