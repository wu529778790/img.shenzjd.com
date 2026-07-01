'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Loader2, Trash2, AlertCircle, RefreshCw, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useConfigStore } from '@/stores/configStore'
import { generateLink } from '@/lib/link'
import { toast } from 'sonner'
import type { UploadTask } from '@/types/image'

interface UploadQueueProps {
  queue: UploadTask[]
  onRemove?: (id: string) => void
  onRetry?: (task: UploadTask) => void
}

export function UploadQueue({ queue, onRemove, onRetry }: UploadQueueProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (task: UploadTask) => {
    let link = task.link
    if (!link && task.result) {
      const cfg = useConfigStore.getState()
      link = generateLink({
        format: cfg.copyFormat,
        cdn: cfg.cdn,
        owner: cfg.owner,
        repo: cfg.repo,
        branch: cfg.branch,
        path: task.result.path,
        fileName: task.result.name,
        useRaw: cfg.useRaw ?? true,
      })
    }
    if (!link) return

    try {
      await navigator.clipboard.writeText(link)
      setCopiedId(task.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('复制失败')
    }
  }

  if (queue.length === 0) return null

  // 计算统计信息
  const stats = {
    total: queue.length,
    success: queue.filter(t => t.status === 'success').length,
    uploading: queue.filter(t => t.status === 'uploading').length,
    error: queue.filter(t => t.status === 'error').length,
    pending: queue.filter(t => t.status === 'pending').length,
  }

  // 获取进度文本描述
  const getProgressText = (progress: number) => {
    if (progress < 20) return '准备中...'
    if (progress < 50) return '正在处理图片'
    if (progress < 90) return '正在上传到 GitHub'
    return '即将完成'
  }

  return (
    <div className="space-y-3" role="list" aria-label="上传队列">
      {/* 优化：添加上传统计头部 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">上传队列</span>
          {stats.total > 0 && (
            <>
              <span>·</span>
              {stats.pending > 0 && <span>{stats.pending} 等待中</span>}
              {stats.uploading > 0 && <span>{stats.uploading} 上传中</span>}
              {stats.success > 0 && <span className="text-green-600 dark:text-green-400">{stats.success} 完成</span>}
              {stats.error > 0 && <span className="text-red-600 dark:text-red-400">{stats.error} 失败</span>}
            </>
          )}
        </div>
        {stats.error > 0 && onRetry && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              // 触发全部重试
              const errorTasks = queue.filter(t => t.status === 'error')
              errorTasks.forEach(task => onRetry(task))
            }}
            className="h-7 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <RefreshCw className="h-3 w-3" />
            重试失败
          </Button>
        )}
      </div>

      {queue.map((task, index) => (
        <div
          key={task.id}
          className={cn(
            'flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg',
            'bg-white dark:bg-gray-800/50',
            'border border-gray-200 dark:border-gray-700/50',
            'shadow-sm transition-all duration-200',
            // 优化：失败任务添加红色边框强调
            task.status === 'error' && 'border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20',
            // 成功任务可点击复制
            task.status === 'success' && 'cursor-pointer hover:border-green-300 dark:hover:border-green-700 hover:shadow-md'
          )}
          role="listitem"
          style={{ animationDelay: `${index * 50}ms` }} // 优化：交错动画延迟
          onClick={task.status === 'success' ? () => handleCopy(task) : undefined}
        >
          {/* 优化：状态图标 - 添加动画和更好的视觉效果 */}
          <div className="flex-shrink-0 pt-0.5">
            {task.status === 'pending' && (
              <div
                className="h-5 w-5 rounded-full border-2 border-gray-300 dark:border-gray-600"
                aria-label="等待上传"
              />
            )}
            {task.status === 'uploading' && (
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-label="上传中" />
            )}
            {task.status === 'success' && !task.thumbnailUrl && (
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" aria-label="上传成功" />
            )}
            {task.status === 'success' && task.thumbnailUrl && (
              <img
                src={task.thumbnailUrl}
                alt={task.file.name}
                className="h-10 w-10 rounded-md object-cover"
              />
            )}
            {task.status === 'error' && (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-500" aria-label="上传失败" />
            )}
          </div>

          {/* 优化：文件信息 - 改进排版和对比度 */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {task.file.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(task.file.size / 1024).toFixed(1)} KB
              </p>
              {task.status === 'pending' && (
                <span className="text-xs text-gray-400 dark:text-gray-500">• 等待中</span>
              )}
              {task.status === 'uploading' && (
                <span className="text-xs text-blue-600 dark:text-blue-400">• 上传中</span>
              )}
              {task.status === 'error' && task.error && (
                <span className="text-xs text-red-600 dark:text-red-400">• {task.error}</span>
              )}
            </div>

            {/* 优化：错误详情显示 */}
            {task.status === 'error' && task.error && (
              <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50">
                <p className="text-xs text-red-700 dark:text-red-300 flex items-start gap-1.5">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span>{task.error}</span>
                </p>
              </div>
            )}
          </div>

          {/* 优化：进度条 - 添加百分比和更好的视觉反馈 */}
          {task.status === 'uploading' && (
            <div className="flex-1 max-w-xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div
                    className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={task.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${task.file.name} 上传进度`}
                  >
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full transition-all duration-300 ease-out relative"
                      style={{ width: `${task.progress}%` }}
                    >
                      {/* 新增：进度条光泽效果 */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>
                {/* 优化：显示百分比 */}
                <span className="text-xs font-semibold text-primary min-w-[2.5rem] text-right">
                  {task.progress}%
                </span>
              </div>
              {/* 优化：显示进度文本 */}
              <p className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                {getProgressText(task.progress)}
              </p>
            </div>
          )}

          {/* 优化：操作按钮 - 更好的悬停效果和触摸目标 */}
          <div className="flex-shrink-0 flex gap-1.5 sm:gap-2" onClick={(e) => e.stopPropagation()}>
            {task.status === 'success' && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
                {copiedId === task.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-green-600 dark:text-green-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">点击复制</span>
                  </>
                )}
              </span>
            )}
            {task.status === 'error' && onRetry && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRetry(task)}
                className="h-8 px-3 text-xs gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>重试</span>
              </Button>
            )}
            {onRemove && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemove(task.id)}
                aria-label={`删除 ${task.file.name}`}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30"
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
