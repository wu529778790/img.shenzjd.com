'use client'

import { useOperationLogStore } from '@/stores/operationLogStore'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Upload, Trash2, Copy, Settings } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const typeConfig: Record<string, { icon: typeof Upload; label: string; color: string }> = {
  upload:   { icon: Upload,    label: '上传', color: 'text-blue-500' },
  delete:   { icon: Trash2,    label: '删除', color: 'text-red-500' },
  copy:     { icon: Copy,      label: '复制', color: 'text-green-500' },
  settings: { icon: Settings,  label: '设置', color: 'text-amber-500' },
}

const statusConfig: Record<string, { icon: typeof CheckCircle; className: string }> = {
  success: { icon: CheckCircle, className: 'text-green-500' },
  error:   { icon: XCircle,    className: 'text-red-500' },
  pending: { icon: Loader2,    className: 'text-gray-400 animate-spin' },
}

export function OperationLogPanel() {
  const logs = useOperationLogStore((s) => s.logs)
  const clearLogs = useOperationLogStore((s) => s.clearLogs)

  if (logs.length === 0) {
    return (
      <Card className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm">操作日志</h3>
        </div>
        <p className="text-sm text-gray-400 text-center py-4">暂无操作记录</p>
      </Card>
    )
  }

  return (
    <Card className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm">操作日志</h3>
        <Button size="sm" variant="ghost" onClick={clearLogs} className="h-7 px-2 text-xs">
          <Trash2 className="h-3 w-3 mr-1" />
          清空
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-220px)] max-h-[400px]">
        <div className="space-y-2">
          {logs.map((log) => {
            const typeInfo = typeConfig[log.type] || typeConfig.settings
            const statusInfo = statusConfig[log.status] || statusConfig.success
            const TypeIcon = typeInfo.icon
            const StatusIcon = statusInfo.icon
            return (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <TypeIcon className={cn('h-4 w-4 flex-shrink-0 mt-0.5', typeInfo.color)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.action}</p>
                  {log.detail && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.detail}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: zhCN })}
                  </p>
                </div>
                <StatusIcon className={cn('h-4 w-4 flex-shrink-0', statusInfo.className)} />
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
