'use client'

import { useState } from 'react'
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
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/utils'
import type { ImageFile } from '@/types/image'

interface ImageCardDeleteConfirmProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  image: ImageFile
  token: string
  owner: string
  repo: string
  branch: string
  /** Called with image id after successful delete so parent can refresh */
  onDeleted: (id: string) => void
}

export function ImageCardDeleteConfirm({
  open,
  onOpenChange,
  image,
  token,
  owner,
  repo,
  branch,
  onDeleted,
}: ImageCardDeleteConfirmProps) {
  const [deleting, setDeleting] = useState(false)

  const handleConfirm = async () => {
    if (!token) return
    setDeleting(true)
    try {
      const response = await fetch(`/api/images/${image.sha}`, {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ owner, repo, filePath: image.path, branch }),
      })
      if (!response.ok) throw new Error('Delete failed')
      toast.success('删除成功')
      onOpenChange(false)
      onDeleted(image.path)
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

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
          <Button variant="destructive" onClick={handleConfirm} disabled={deleting}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            确认删除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
