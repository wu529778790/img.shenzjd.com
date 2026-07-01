'use client'

import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import { useUploadStore } from '@/stores/uploadStore'
import { useConfigStore } from '@/stores/configStore'
import { generateLink } from '@/lib/link'
import { toast } from 'sonner'

export function RecentUploads() {
  const queue = useUploadStore((s) => s.queue)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const successTasks = queue.filter((t) => t.status === 'success' && t.thumbnailUrl)

  if (successTasks.length === 0) return null

  const handleCopy = async (task: typeof successTasks[0]) => {
    // 优先用已生成的链接，否则按当前配置重新生成
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

  return (
    <div className="mt-5 rounded-2xl bg-card border shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b">
        <span className="text-sm font-medium">本次上传</span>
        <span className="ml-2 text-xs text-muted-foreground">{successTasks.length} 张</span>
      </div>
      <div className="grid grid-cols-3 gap-px bg-border p-px">
        {successTasks.map((task) => (
          <div
            key={task.id}
            className="group relative aspect-square bg-card flex items-center justify-center overflow-hidden"
          >
            {/* 缩略图 */}
            <img
              src={task.thumbnailUrl}
              alt={task.result?.name ?? task.file.name}
              className="w-full h-full object-cover"
            />

            {/* 悬浮操作层 */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                onClick={() => handleCopy(task)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-xs font-medium hover:bg-white dark:hover:bg-gray-700 transition-colors"
              >
                {copiedId === task.id ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-500" />
                    已复制
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    复制链接
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
