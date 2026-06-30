'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import { BULK_DELETE_CONFIG } from '@/lib/constants'
import { debugLog } from '@/lib/debug'
import type { ImageFile } from '@/types/image'

export function useImages() {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const configStore = useConfigStore()
  const queryClient = useQueryClient()

  const { owner, repo, branch, cdn, useRaw } = configStore

  // 调试：在 hook 执行时立即打印状态
  debugLog('[Images Hook] Initialized with:', {
    token: !!token,
    owner,
    repo,
    branch,
    configKeys: Object.keys(configStore).filter(k => !['updateConfig', 'resetConfig', 'markConfigChecked', 'needsConfigCheck', 'invalidateConfigCheck'].includes(k)),
  })

  // 获取图片列表
  const { data: images = [], isLoading, error } = useQuery({
    queryKey: ['images', owner, repo, branch],
    queryFn: async () => {
      debugLog('[Images Query] Query function executed!')
      if (!token || !owner || !repo) {
        debugLog('[Images] Missing token/owner/repo, returning empty array', { token: !!token, owner, repo })
        return []
      }

      debugLog('[Images] Fetching images from GitHub API...', { owner, repo, branch })
      const api = new GitHubAPI(token, owner, repo, branch)

      // 使用 Git Trees API 一次性获取所有文件（仅需 1 次请求）
      const allFiles = await api.listAllFilesWithTree()
      debugLog('[Images] Total files from GitHub API:', allFiles.length)
      debugLog('[Images] Sample files:', allFiles.slice(0, 5).map(f => ({ name: f.name, path: f.path, type: f.type, size: f.size })))

      // 过滤出图片文件 - 使用 Set 提高性能
      const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'])
      const imageFiles = allFiles.filter((file) => {
        const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
        debugLog('[Images] Checking file:', { name: file.name, ext, path: file.path, size: file.size })
        return imageExtensions.has(ext)
      })
      debugLog('[Images] Image files found:', imageFiles.length)
      debugLog('[Images] Sample images:', imageFiles.slice(0, 5).map(f => ({ name: f.name, path: f.path })))

      // 调试：如果是空数组，显示所有文件帮助诊断
      if (imageFiles.length === 0 && allFiles.length > 0) {
        debugLog('[Images] ⚠️ No images found! All files:', allFiles.map(f => ({
          name: f.name,
          path: f.path,
          type: f.type,
          size: f.size,
        })))
      }

      // 转换为业务层对象（不获取提交时间，使用文件名/大小/路径排序）
      // 使用 Map 去重，避免重复的 SHA 导致 React key 冲突
      const imageMap = new Map<string, ImageFile>()
      imageFiles.forEach((file) => {
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

        const imageFile: ImageFile = {
          ...file,
          id: file.sha,
          type: 'file' as const,
          uploaded_at: undefined, // 不使用提交时间
          cdnUrl,
        }

        // 使用 SHA 作为 key 去重
        imageMap.set(file.sha, imageFile)
      })

      debugLog('[Images] After deduplication:', imageMap.size, 'unique images out of', imageFiles.length)

      return Array.from(imageMap.values())
    },
    enabled: !!token && !!owner && !!repo,
    staleTime: 0, // 每次挂载都重新获取，确保上传后立即看到新图片
    gcTime: 5 * 60 * 1000, // 5 分钟
  })

  debugLog('[Images Hook] Query enabled:', !!token && !!owner && !!repo, { token: !!token, owner, repo, branch })

  // 用 ref 跟踪 images 变化，供 handleDelete 使用
  // 使用 useEffect 确保只在 images 实际变化时更新 ref
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // 删除图片
  const deleteMutation = useMutation({
    mutationFn: async (filePath: string) => {
      if (!token || !owner || !repo) throw new Error('Not configured')

      const api = new GitHubAPI(token, owner, repo, branch)

      // 获取文件的 SHA
      let sha: string
      try {
        const file = await api.getFile(filePath, branch)
        sha = file.sha
      } catch (error) {
        // 如果文件不存在（404），说明已经被删除了，视为删除成功（幂等性）
        const status = (error as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          debugLog('[Delete] File already deleted:', filePath)
          return filePath
        }
        throw error
      }

      // 删除文件
      await api.deleteFile(filePath, `[skip ci] https://img.shenzjd.com/`, sha, branch)

      return filePath
    },
    onSuccess: () => {
      toast.success('删除成功')
      // 刷新图片列表
      queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
    },
    onError: (error) => {
      // 如果是 404 错误，说明文件已经被删除了，不显示错误提示
      const status = (error as { response?: { status?: number } })?.response?.status
      const message = error instanceof Error ? error.message : String(error)
      if (status === 404) {
        debugLog('[Delete] File already gone:', message)
        // 仍然刷新列表以保持同步
        queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
      } else {
        toast.error('删除失败')
      }
    },
  })

  // 批量删除 - 使用分批和延迟，避免阻塞 UI
  const bulkDeleteMutation = useMutation({
    mutationFn: async (filePaths: string[]) => {
      if (!token || !owner || !repo) throw new Error('Not configured')

      const api = new GitHubAPI(token, owner, repo, branch)

      // 分批删除，每批最多 3 个，批次间延迟 500ms
      // 使用 BULK_DELETE_CONFIG 配置便于调整
      const results = []
      const { BATCH_SIZE, BATCH_DELAY_MS } = BULK_DELETE_CONFIG

      for (let i = 0; i < filePaths.length; i += BATCH_SIZE) {
        const batch = filePaths.slice(i, i + BATCH_SIZE)

        const batchResults = await Promise.allSettled(
          batch.map(async (filePath) => {
            // 先获取当前文件信息以获取正确的 SHA
            let sha: string
            try {
              const file = await api.getFile(filePath, branch)
              sha = file.sha
            } catch (error) {
              // 如果文件不存在（404），说明已经被删除了，视为删除成功（幂等性）
              const status = (error as { response?: { status?: number } })?.response?.status
              if (status === 404) {
                debugLog('[Bulk Delete] File already deleted:', filePath)
                return filePath
              }
              throw error
            }

            await api.deleteFile(filePath, `[skip ci] https://img.shenzjd.com/`, sha, branch)
            return filePath
          })
        )

        results.push(...batchResults)

        // 批次之间添加延迟（最后一批不加）
        if (i + BATCH_SIZE < filePaths.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
        }
      }

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
    onError: (error) => {
      // 如果是 404 错误，说明文件已经被删除了，不显示错误提示
      const status = (error as { response?: { status?: number } })?.response?.status
      const message = error instanceof Error ? error.message : String(error)
      if (status === 404) {
        debugLog('[Bulk Delete] Files already gone:', message)
        // 仍然刷新列表以保持同步
        queryClient.invalidateQueries({ queryKey: ['images', owner, repo, branch] })
      } else {
        toast.error('批量删除失败')
      }
    },
  })

  const handleDelete = useCallback((filePathOrId: string) => {
    // 如果收到的是 SHA id，先查找对应的文件路径
    const filePath = imagesRef.current.find((img) => img.id === filePathOrId || img.sha === filePathOrId)?.path || filePathOrId
    deleteMutation.mutate(filePath)
  }, [deleteMutation])

  const handleBulkDelete = useCallback((ids: string[]) => {
    // 将 SHA id 转换为文件路径（selectedIds 中存的是 image.id=sha）
    const filePaths = ids.map((id) => {
      const image = imagesRef.current.find((img) => img.id === id || img.sha === id)
      return image?.path || id
    })
    bulkDeleteMutation.mutate(filePaths)
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
