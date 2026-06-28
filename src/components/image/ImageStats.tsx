'use client'

import { useMemo } from 'react'
import { Image as ImageIcon, HardDrive, FileImage, Calendar } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import type { ImageFile } from '@/types/image'

interface ImageStatsProps {
  images: ImageFile[]
}

interface StatCardProps {
  icon: React.ReactNode
  value: string
  label: string
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <Card className="p-5 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

export function ImageStats({ images }: ImageStatsProps) {
  const stats = useMemo(() => {
    if (images.length === 0) return null

    // Total count
    const totalCount = images.length

    // Total size
    const totalSize = images.reduce((sum, img) => sum + img.size, 0)

    // Dominant format
    const formatCounts: Record<string, number> = {}
    images.forEach((img) => {
      const ext = img.name.split('.').pop()?.toLowerCase() || 'unknown'
      formatCounts[ext] = (formatCounts[ext] || 0) + 1
    })
    const dominantFormat = Object.entries(formatCounts).sort((a, b) => b[1] - a[1])[0]
    const dominantFormatLabel = dominantFormat
      ? `${dominantFormat[0].toUpperCase()} (${Math.round(dominantFormat[1] / totalCount * 100)}%)`
      : '—'

    // Last upload
    const lastUpload = images.reduce((latest, img) => {
      const date = img.uploaded_at ? new Date(img.uploaded_at).getTime() : 0
      return date > latest ? date : latest
    }, 0)
    const lastUploadLabel = lastUpload
      ? formatDistanceToNow(new Date(lastUpload), { addSuffix: true, locale: zhCN })
      : '未知'

    return {
      totalCount: totalCount.toString(),
      totalSize: formatFileSize(totalSize),
      dominantFormat: dominantFormatLabel,
      lastUpload: lastUploadLabel,
    }
  }, [images])

  if (!stats) return null

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<ImageIcon className="h-6 w-6 text-primary" />}
        value={stats.totalCount}
        label="总图片数"
      />
      <StatCard
        icon={<HardDrive className="h-6 w-6 text-primary" />}
        value={stats.totalSize}
        label="总大小"
      />
      <StatCard
        icon={<FileImage className="h-6 w-6 text-primary" />}
        value={stats.dominantFormat}
        label="主要格式"
      />
      <StatCard
        icon={<Calendar className="h-6 w-6 text-primary" />}
        value={stats.lastUpload}
        label="最近上传"
      />
    </div>
  )
}
