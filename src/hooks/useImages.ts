'use client'

import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import type { GitHubFileInfo, ImageFile } from '@/types/image'

// ── Conversion: GitHub API layer → Business layer ──────────────────────────
// GitHubFileInfo 是 API 层的原始类型（来自 GitHub REST API）
// ImageFile 是业务层类型（含 cdnUrl, uploaded_at 等派生字段）
// 这个转换函数是两层之间的唯一边界
function toImageFile(file: GitHubFileInfo, cdnUrl: string, commitTime?: Date): ImageFile {
  return {
    ...file,
    id: file.sha,
    type: 'file' as const,
    uploaded_at: commitTime, // 使用 GitHub Commits API 获取的最后提交时间
    cdnUrl,
  }
}

export function useImages() {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const configStore = useConfigStore()
  const queryClient = useQueryClient()
  const { addLog: addOperationLog } = useOperationLogStore()

  const { owner, repo, branch, cdn, useRaw } = configStore

  // 获取图片列表
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['images', owner, repo, branch],
    queryFn: async () => {
      if (!token || !owner || !repo) return []

      const api = new GitHubAPI(token, owner, repo, branch)

      // 递归获取所有文件（包括子文件夹）
      const allFiles: GitHubFileInfo[] = await api.listAllFiles('')

      // 过滤出图片文件
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
      const imageFiles = allFiles
        .filter((file) => {
          const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
          return imageExtensions.includes(ext)
        })

      // 批量获取所有文件的最后提交时间
      const filePaths = imageFiles.map((file) => file.path)
      const commitTimes = await api.getFilesCommitTime(filePaths)

      // 转换为业务层对象，包含提交时间
      return imageFiles.map((file) => {
        const cdnUrl = generateLink({
          format: 'url',
          cdn: cdn || 'github',
          owner,
          repo,
          branch,
          path: file.path,
          fileName: file.name,
          useRaw: useRaw ?? true,
        })

        return toImageFile(file, cdnUrl, commitTimes.get(file.path) || undefined)
      })
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
    onSuccess: (_data, variables: string) => {
      toast.success('删除成功')
      addOperationLog({
        type: 'delete',
        action: '删除文件',
        status: 'success',
        detail: variables,
      })
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
      addOperationLog({
        type: 'delete',
        action: data.failed === 0 ? '批量删除成功' : '批量删除（部分失败）',
        status: data.failed === 0 ? 'success' : 'error',
        detail: `${data.successful} 成功，${data.failed} 失败`,
      })
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
