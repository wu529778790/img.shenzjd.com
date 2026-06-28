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
import type { ImageFile, LinkOptions } from '@/types/image'

export function useUpload() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ''
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

      // 1. 压缩图片
      let processedFile = file
      if (config.compressionEnabled) {
        try {
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: config.compressionQuality / 100,
          })
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

      // 4. 上传到 GitHub
      const result = await api.createOrUpdateFile(
        filePath,
        processedFile,
        `Upload ${fileName} via ImgX`
      )

      const imageFile: ImageFile = {
        id: result.sha,
        name: fileName,
        path: filePath,
        sha: result.sha,
        size: processedFile.size,
        url: `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`,
        html_url: `https://github.com/${config.owner}/${config.repo}/blob/${config.branch}/${filePath}`,
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

      return { file: imageFile, link }
    },
    onSuccess: (_data, _variables: File) => {
      toast.success('上传成功')
      addOperationLog({
        type: 'upload',
        action: '上传成功',
        status: 'success',
        detail: _variables?.name,
      })
    },
    onError: (error: Error) => {
      toast.error(error.message)
      addOperationLog({
        type: 'upload',
        action: '上传失败',
        status: 'error',
        detail: error.message,
      })
    },
  })

  // 添加文件到上传队列
  const addFiles = useCallback(
    (files: File[]) => {
      // 添加到队列
      addTasks(files)

      // 逐个上传
      files.forEach((file) => {
        const taskId = Math.random().toString(36).substring(7)

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
          },
          onError: (error: Error) => {
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
    [addTasks, updateTask, uploadMutation]
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
