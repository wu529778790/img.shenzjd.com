'use client'

import { CheckCircle, XCircle, Loader2, Trash2 } from 'lucide-react'
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
    <div className="space-y-2" role="list" aria-label="上传队列">
      {queue.map((task) => (
        <div
          key={task.id}
          className="flex items-center gap-4 p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-soft-sm"
          role="listitem"
        >
          {/* 状态图标 */}
          <div className="flex-shrink-0">
            {task.status === 'pending' && (
              <div className="h-5 w-5 rounded-full border-2 border-gray-300" aria-label="等待上传" />
            )}
            {task.status === 'uploading' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="上传中" />
            )}
            {task.status === 'success' && (
              <CheckCircle className="h-5 w-5 text-green-500" aria-label="上传成功" />
            )}
            {task.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-500" aria-label="上传失败" />
            )}
          </div>

          {/* 文件信息 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{task.file.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(task.file.size / 1024).toFixed(1)} KB
              {task.status === 'pending' && ' • 等待中'}
              {task.status === 'uploading' && ` • 上传中 ${task.progress}%`}
              {task.status === 'error' && task.error && ` • ${task.error}`}
            </p>
          </div>

          {/* 进度条 */}
          {task.status === 'uploading' && (
            <div className="flex-1 max-w-xs space-y-1">
              <div
                className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                role="progressbar"
                aria-valuenow={task.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${task.file.name} 上传进度`}
              >
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
              {task.progress < 20 && <p className="text-xs text-gray-500">准备中...</p>}
              {task.progress >= 20 && task.progress < 50 && <p className="text-xs text-blue-600 dark:text-blue-400">正在处理图片</p>}
              {task.progress >= 50 && task.progress < 90 && <p className="text-xs text-blue-600 dark:text-blue-400">正在上传到 GitHub</p>}
              {task.progress >= 90 && <p className="text-xs text-green-600 dark:text-green-400">即将完成</p>}
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
                aria-label={`删除 ${task.file.name}`}
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
