'use client'

import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { UploadTask } from '@/types/image'

interface UploadQueueProps {
  queue: UploadTask[]
  onRemove?: (id: string) => void
  onRetry?: (task: UploadTask) => void
}

export function UploadQueue({ queue, onRemove, onRetry }: UploadQueueProps) {
  if (queue.length === 0) return null

  return (
    <div className="space-y-2">
      {queue.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800"
        >
          {/* 状态图标 */}
          <div className="flex-shrink-0">
            {task.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
            )}
            {task.status === 'uploading' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            )}
            {task.status === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            {task.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.file.name}</p>
            <p className="text-xs text-gray-500">
              {(task.file.size / 1024).toFixed(1)} KB
              {task.status === 'uploading' && ` • ${task.progress}%`}
              {task.status === 'error' && task.error && ` • ${task.error}`}
            </p>
          </div>

          {/* 进度条 */}
          {task.status === 'uploading' && (
            <div className="flex-1 max-w-xs">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex-shrink-0 flex gap-2">
            {task.status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRetry(task)}
              >
                重试
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(task.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
