'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Image as ImageIcon, Link2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useConfigStore } from '@/stores/configStore'
import { useUpload } from '@/hooks/useUpload'
import { UploadArea } from '@/components/upload/UploadArea'
import { UploadQueue } from '@/components/upload/UploadQueue'

export default function UploadPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const configStore = useConfigStore()
  const { uploadQueue, addFiles } = useUpload()

  const [recentLinks, setRecentLinks] = useState<string[]>([])

  // 检查配置是否完整
  const { owner, repo, branch } = configStore
  const isConfigured = owner && repo && branch

  // 监听上传队列，收集成功后的链接
  useEffect(() => {
    const successTasks = uploadQueue.filter(task => task.status === 'success')
    if (successTasks.length > 0) {
      // 这里可以收集链接并显示
      // TODO: 实现链接收集和展示
    }
  }, [uploadQueue])

  // 如果未登录，显示登录提示
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">需要登录</h2>
          <p className="text-gray-500 mb-4">
            登录后才能上传图片和管理图床
          </p>
          <Button onClick={() => router.push('/login')}>
            去登录
          </Button>
        </Card>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto py-8">
        <Card className="p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">请先配置图床</h2>
          <p className="text-gray-500 mb-4">
            在开始上传之前，需要先配置您的 GitHub 仓库
          </p>
          <Button onClick={() => router.push('/config')}>
            去配置
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">上传图片</h1>
        <p className="text-gray-500 mt-2">
          拖拽或选择图片上传到 {owner}/{repo}
        </p>
      </div>

      <Card className="p-8">
        <UploadArea onFilesSelected={addFiles} />

        {uploadQueue.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">上传队列</h2>
              <span className="text-sm text-gray-500">
                {uploadQueue.length} 个文件
              </span>
            </div>
            <UploadQueue
              queue={uploadQueue}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
