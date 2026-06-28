'use client'

import { useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { compressImage } from '@/lib/compress'
import { addWatermark } from '@/lib/watermark'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useUploadStore } from '@/stores/uploadStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import type { ImageFile, LinkOptions } from '@/types/image'

export function useUpload() {
  const { data: session } = useSession()
  const token = (session as any)?.accessToken || ''
  const config = useConfigStore()
  const { addTasks, updateTask, removeTask, clearQueue } = useUploadStore()

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
    onSuccess: () => {
      toast.success('上传成功')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

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
          onSuccess: () => {
            updateTask(taskId, {
              status: 'success',
              progress: 100,
            })
          },
          onError: (error) => {
            updateTask(taskId, {
              status: 'error',
              progress: 0,
              error: error.message,
            })
          },
        })
      })
    },
    [addTasks, updateTask, uploadMutation]
  )

  const clearCompleted = useCallback(() => {
    // TODO: 清除已完成的任务
    clearQueue()
  }, [clearQueue])

  return {
    addFiles,
    clearCompleted,
    uploadQueue: useUploadStore((state) => state.queue),
    isUploading: uploadMutation.isPending,
  }
}
