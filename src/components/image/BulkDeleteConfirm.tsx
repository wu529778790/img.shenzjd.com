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
import { AlertTriangle, Trash2 } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface BulkDeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  images: ImageFile[]
  onConfirm: () => void
}

export function BulkDeleteConfirm({ open, onOpenChange, images, onConfirm }: BulkDeleteConfirmProps) {
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
                此操作无法撤销，确定要删除选中的 {images.length} 个文件吗？
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* 文件列表预览 */}
        {images.length <= 10 && (
          <div className="mt-3 max-h-40 overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-3">
            <div className="space-y-1">
              {images.map((image) => (
                <div key={image.id} className="flex items-center gap-2 text-sm">
                  <span className="truncate font-mono text-gray-600 dark:text-gray-400">{image.name}</span>
                  <span className="text-gray-400 text-xs">{formatFileSize(image.size)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length > 10 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            已选择 {images.length} 个文件，数量较多不逐一显示
          </p>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onOpenChange(false) }}>
            <Trash2 className="h-4 w-4 mr-2" />
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
