'use client'

import { useCallback, useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { GitHubAPI } from '@/lib/github'
import type { ImageFile } from '@/types/image'

export function useImages() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ''
  const configStore = useConfigStore()
  const queryClient = useQueryClient()
  const [allImages, setAllImages] = useState<ImageFile[]>([])

  const { owner, repo, branch } = configStore

  // 获取图片列表
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['images', owner, repo, branch],
    queryFn: async () => {
      if (!token || !owner || !repo) return []

      const api = new GitHubAPI(token, owner, repo, branch)
      const files = await api.listContents('')

      // 过滤出图片文件
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const imageFiles = files
        .filter((file) => {
          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
          return imageExtensions.includes(ext)
        })
        .map((file) => ({
          ...file,
          id: file.sha,
          type: 'file' as const,
          uploaded_at: new Date(),
        }))

      return imageFiles
    },
    enabled: !!token && !!owner && !!repo,
    staleTime: 60 * 1000, // 1 分钟
  })

  // 删除图片
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      if (!token || !owner || !repo) throw new Error('Not configured')

      const api = new GitHubAPI(token, owner, repo, branch)

      // 获取文件的 SHA
      const file = await api.getFile(filePath)
      const sha = file.sha

      // 删除文件
      await api.deleteFile(filePath, `Delete ${filePath} via ImgX`, sha)

      return filePath
    },
    onSuccess: () => {
      toast.success('删除成功')
      // 刷新图片列表
      queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
    },
    onError: () => {
      toast.error('删除失败')
    },
  })

  // 批量删除
  const bulkDeleteMutation = useMutation({
    mutationFn: async (filePaths: string[]) => {
      if (!token || !owner || !repo) throw new Error('Not configured')

      const api = new GitHubAPI(token, owner, repo, branch)

      // 逐个删除
      const results = await Promise.allSettled(
        filePaths.map(async (filePath) => {
          const file = await api.getFile(filePath)
          await api.deleteFile(filePath, `Delete ${filePath} via ImgX`, file.sha)
          return filePath
        })
      )

      const successful = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      return { successful, failed }
    },
    onSuccess: (data) => {
      if (data.failed === 0) {
        toast.success(`成功删除 ${data.successful} 个文件`)
      } else {
        toast.success(`删除完成：${data.successful} 成功，${data.failed} 失败`)
      }
      // 刷新图片列表
      queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
    },
    onError: () => {
      toast.error('批量删除失败')
    },
  })

  const handleDelete = useCallback((id: string) => {
    deleteMutation.mutate(id)
  }, [deleteMutation])

  const handleBulkDelete = useCallback((ids: string[]) => {
    bulkDeleteMutation.mutate(ids)
  }, [bulkDeleteMutation])

  return {
    images,
    isLoading,
    error,
    handleDelete,
    handleBulkDelete,
    isDeleting: deleteMutation.isPending || bulkDeleteMutation.isPending,
  }
}
