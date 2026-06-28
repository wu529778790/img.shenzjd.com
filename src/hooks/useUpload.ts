'use client'

import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { compressImage } from '@/lib/compress'
import { addWatermark } from '@/lib/watermark'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useUploadStore } from '@/stores/uploadStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import { useOperationLogStore } from '@/stores/operationLogStore'
import type { ImageFile, LinkOptions, UploadTask } from '@/types/image'

export function useUpload() {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const config = useConfigStore()
  const queryClient = useQueryClient()
  const { addLog: addOperationLog } = useOperationLogStore()
  const { addTasks, updateTask, removeTask: removeTaskStore, clearQueue, retryTask: retryTaskStore, retryFailed: retryFailedStore } = useUploadStore()

  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<{ file: ImageFile; link: string }> => {
      if (!token) {
        throw new Error('Not authenticated')
      }

      const api = new GitHubAPI(token, config.owner, config.repo, config.branch)

      console.log('[Upload] Starting upload for:', file.name, {
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        directory: config.directory,
      })

      // 1. 压缩图片
      let processedFile = file
      if (config.compressionEnabled) {
        try {
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: config.compressionQuality / 100,
          })
          console.log('[Upload] Compression completed:', file.name)
        } catch (error) {
          console.error('Compression failed:', error)
          toast.error(`${file.name} 压缩失败，将上传原图`)
        }
      }

      // 2. 添加水印
      if (config.watermarkEnabled && config.watermarkText) {
        try {
          const watermarkedBlob = await addWatermark(processedFile, {
            text: config.watermarkText,
            color: config.watermarkColor,
            size: config.watermarkSize,
            position: config.watermarkPosition,
          })
          processedFile = new File([watermarkedBlob], file.name, {
            type: 'image/jpeg',
          })
          console.log('[Upload] Watermark added:', file.name)
        } catch (error) {
          console.error('Watermark failed:', error)
          toast.error(`${file.name} 水印添加失败`)
        }
      }

      // 3. 生成文件路径
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(2, 8)
      const ext = processedFile.name.split('.').pop()
      const fileName = `${timestamp}-${random}.${ext}`
      const filePath = config.directory ? `${config.directory}/${fileName}` : fileName

      console.log('[Upload] File path:', filePath)

      // 4. 上传到 GitHub
      try {
        console.log('[Upload] Starting GitHub upload...')
        const result = await api.createOrUpdateFile(
          filePath,
          processedFile,
          `Upload ${fileName} via ImgX`
        )

        console.log('[Upload] GitHub upload result:', result)

        // GitHub API 可能有延迟，等待一下让文件同步
        console.log('[Upload] Waiting 1 second for GitHub to sync...')
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 尝试验证文件是否创建成功（不阻塞流程）
        console.log('[Upload] Attempting to verify file...')
        try {
          await api.getFile(filePath)
          console.log('[Upload] File verified successfully')
        } catch (verifyErr: any) {
          // 验证失败只记录警告，不阻塞上传流程
          console.warn('[Upload] Verification skipped (GitHub API delay):', verifyErr?.message || verifyErr)
        }

        const imageFile: ImageFile = {
          id: result.sha,
          name: fileName,
          path: filePath,
          sha: result.sha,
          size: processedFile.size,
          url: `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`,
          html_url: result.html_url,
          download_url: `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${filePath}`,
          type: 'file',
          uploaded_at: new Date(),
        }

        // 5. 生成链接
        const linkOptions: LinkOptions = {
          format: 'markdown',
          cdn: 'github',
          owner: config.owner,
          repo: config.repo,
          branch: config.branch,
          path: filePath,
          fileName: fileName,
          useRaw: true,
        }

        const link = generateLink(linkOptions)

        console.log('[Upload] ✅ Upload completed successfully:', fileName)
        console.log('[Upload] File URL:', result.html_url)

        return { file: imageFile, link }
      } catch (error: any) {
        console.error('[Upload] ❌ GitHub API error:', error)
        console.error('[Upload] Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
        throw new Error(`上传失败: ${error.message}`)
      }
    },
    // onSuccess and onError removed — dead code; per-call-site overrides below
  })

  // 添加文件到上传队列
  const addFiles = useCallback(
    (files: File[]) => {
      // 为每个文件创建任务，确保 taskId 一致
      const newTasks: UploadTask[] = files.map((file) => ({
        id: Math.random().toString(36).substring(7),
        file,
        status: 'pending',
        progress: 0,
      }))

      // 直接添加到 store，taskId 保持一致性
      useUploadStore.setState((state) => ({
        queue: [...state.queue, ...newTasks],
      }))

      // 触发 React 重新渲染
      useUploadStore.getState()

      // 逐个上传
      newTasks.forEach(({ id: taskId, file }) => {
        // 更新任务状态为上传中
        updateTask(taskId, { status: 'uploading', progress: 0 })

        uploadMutation.mutate(file, {
          onSuccess: (_data, variables: File) => {
            updateTask(taskId, {
              status: 'success',
              progress: 100,
            })
            addOperationLog({
              type: 'upload',
              action: '上传成功',
              status: 'success',
              detail: variables?.name,
            })

            // 刷新图片列表
            queryClient.invalidateQueries({ queryKey: ['images', config.owner, config.repo, config.branch] })
          },
          onError: (error: Error) => {
            console.error('Upload failed:', error)
            updateTask(taskId, {
              status: 'error',
              progress: 0,
              error: error.message,
            })
            addOperationLog({
              type: 'upload',
              action: '上传失败',
              status: 'error',
              detail: error.message,
            })
          },
        })
      })
    },
    [updateTask, uploadMutation, queryClient, config]
  )

  // 获取失败任务的文件列表
  const getFailedTaskFiles = useCallback((): File[] => {
    const queue = useUploadStore.getState().queue
    return queue
      .filter((task) => task.status === 'error')
      .map((task) => task.file)
  }, [])

  // 获取单个失败任务的文件
  const getFailedTaskFile = useCallback((taskId: string): File | null => {
    const queue = useUploadStore.getState().queue
    const task = queue.find((t) => t.id === taskId)
    if (task && task.status === 'error') {
      return task.file
    }
    return null
  }, [])

  // 重试单个失败任务
  const retryTask = useCallback((taskId: string) => {
    const file = getFailedTaskFile(taskId)
    if (file) {
      // 重置任务状态
      retryTaskStore(taskId)
      // 重新上传
      addFiles([file])
    }
  }, [getFailedTaskFile, retryTaskStore, addFiles])

  // 重试所有失败任务
  const retryAllFailed = useCallback(() => {
    const failedFiles = getFailedTaskFiles()
    if (failedFiles.length > 0) {
      // 重置所有失败任务
      const failedIds = retryFailedStore()
      // 重新上传所有失败的文件
      addFiles(failedFiles)
      return failedIds.length
    }
    return 0
  }, [getFailedTaskFiles, retryFailedStore, addFiles])

  // 移除单个任务
  const removeTask = useCallback((taskId: string) => {
    removeTaskStore(taskId)
  }, [removeTaskStore])

  const clearCompleted = useCallback(() => {
    clearQueue()
  }, [clearQueue])

  return {
    addFiles,
    clearCompleted,
    removeTask,
    retryTask,
    retryAllFailed,
    uploadQueue: useUploadStore((state) => state.queue),
    isUploading: uploadMutation.isPending,
  }
}
