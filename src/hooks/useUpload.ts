'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { compressImage } from '@/lib/compress'
import { addWatermark } from '@/lib/watermark'
import { useSession } from 'next-auth/react'
import { useConfigStore } from '@/stores/configStore'
import { useUploadStore } from '@/stores/uploadStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import { useOperationLogStore } from '@/stores/operationLogStore'
import { debugLog, debugError, debugWarn } from '@/lib/debug'  // ✅ 使用调试工具
import type { ImageFile, LinkOptions, UploadTask } from '@/types/image'

export function useUpload() {
  const { data: session } = useSession()
  const token = session?.accessToken || ''
  const config = useConfigStore()
  const queryClient = useQueryClient()
  const { addLog: addOperationLog } = useOperationLogStore()
  const { updateTask, removeTask: removeTaskStore, clearQueue, retryTask: retryTaskFn, retryFailed: retryFailedFn } = useUploadStore()

  // 上传单个文件的函数
  const uploadSingleFile = useCallback(async (
    file: File,
    taskId: string
  ): Promise<void> => {
    if (!token) {
      updateTask(taskId, {
        status: 'error',
        progress: 0,
        error: 'Not authenticated'
      })
      return
    }

    const api = new GitHubAPI(token, config.owner, config.repo, config.branch)

    debugLog('[Upload] Starting upload for:', file.name, {
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      directory: config.directory,
    })

    try {
      // 1. 压缩图片
      let processedFile = file
      if (config.compressionEnabled) {
        try {
          debugLog('[Progress] Setting progress to 10% (compression start)')
          updateTask(taskId, { progress: 10 }) // 压缩开始
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: config.compressionQuality / 100,
          })
          debugLog('[Progress] Setting progress to 20% (compression done)')
          updateTask(taskId, { progress: 20 }) // 压缩完成
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          debugLog('[Upload] Compression completed:', file.name)
        } catch (error) {
          debugError('Compression failed:', error)
          toast.error(`${file.name} 压缩失败，将上传原图`)
        }
      }

      // 2. 添加水印
      if (config.watermarkEnabled && config.watermarkText) {
        try {
          debugLog('[Progress] Setting progress to 30% (watermark start)')
          updateTask(taskId, { progress: 30 }) // 水印开始
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          const watermarkedBlob = await addWatermark(processedFile, {
            text: config.watermarkText,
            color: config.watermarkColor,
            size: config.watermarkSize,
            position: config.watermarkPosition,
          })
          processedFile = new File([watermarkedBlob], file.name, {
            type: 'image/jpeg',
          })
          debugLog('[Progress] Setting progress to 40% (watermark done)')
          updateTask(taskId, { progress: 40 }) // 水印完成
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          debugLog('[Upload] Watermark added:', file.name)
        } catch (error) {
          debugError('Watermark failed:', error)
          toast.error(`${file.name} 水印添加失败`)
        }
      }

      // 3. 生成文件路径
      const ext = processedFile.name.split('.').pop()
      const fileName = config.useOriginalFileName
        ? processedFile.name                                    // 保持原名
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`  // 时间戳重命名
      const filePath = config.directory ? `${config.directory}/${fileName}` : fileName

      debugLog('[Upload] File path:', filePath)
      debugLog('[Progress] Setting progress to 50% (ready to upload)')
      updateTask(taskId, { progress: 50 }) // 准备上传
      await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示

      // 4. 上传到 GitHub
      debugLog('[Upload] Starting GitHub upload...')
      debugLog('[Upload] Target branch:', config.branch)
      const result = await api.createOrUpdateFile(
        filePath,
        processedFile,
        `[skip ci] https://img.shenzjd.com/`,
        config.branch,
        (progress) => {
          // 实时更新上传进度 (50% -> 90%)
          const totalProgress = 50 + Math.round(progress * 0.4)
          debugLog('[Progress] GitHub callback progress:', progress, '-> total:', totalProgress, 'for task:', taskId)
          updateTask(taskId, { progress: totalProgress })
          debugLog('[Progress] updateTask called, checking state...')
          const state = useUploadStore.getState()
          const task = state.queue.find(t => t.id === taskId)
          debugLog('[Progress] Current task state:', task?.status, task?.progress)
        }
      )

      debugLog('[Upload] GitHub upload result:', result)
      debugLog('[Progress] Setting progress to 90% (GitHub upload done)')
      updateTask(taskId, { progress: 90 }) // GitHub 上传完成

      // GitHub API 可能有延迟，等待一下让文件同步
      debugLog('[Upload] Waiting 1 second for GitHub to sync...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 尝试验证文件是否创建成功（不阻塞流程）
      debugLog('[Upload] Attempting to verify file...')
      try {
        await api.getFile(filePath, config.branch)
        debugLog('[Upload] File verified successfully')
      } catch (verifyErr: any) {
        // 验证失败只记录警告，不阻塞上传流程
        debugWarn('[Upload] Verification skipped (GitHub API delay):', verifyErr?.message || verifyErr)
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

      debugLog('[Upload] ✅ Upload completed successfully:', fileName)
      debugLog('[Upload] File URL:', result.html_url)

      // 上传成功
      debugLog('[Progress] Setting progress to 100% (upload complete)')
      updateTask(taskId, {
        status: 'success',
        progress: 100,
      })
      addOperationLog({
        type: 'upload',
        action: '上传成功',
        status: 'success',
        detail: file.name,
      })

      // 生成链接并自动复制到剪贴板
      const linkOptions: LinkOptions = {
        format: config.copyFormat || 'markdown',
        cdn: config.cdn || 'github',
        owner: config.owner,
        repo: config.repo,
        branch: config.branch,
        path: filePath,
        fileName: fileName,
        useRaw: config.useRaw ?? true,
      }

      const link = generateLink(linkOptions)

      // 如果启用了自动复制，复制链接到剪贴板
      if (config.autoCopyAfterUpload) {
        try {
          await navigator.clipboard.writeText(link)
          toast.success('链接已复制到剪贴板', {
            duration: 3000,
          })
          debugLog('[Upload] Link copied to clipboard:', link)
        } catch (err) {
          debugError('[Upload] Failed to copy link:', err)
          toast.error('复制链接失败，请手动复制')
        }
      }

      // 刷新图片列表
      queryClient.invalidateQueries({ queryKey: ['images', config.owner, config.repo, config.branch] })
    } catch (error: any) {
      debugError('[Upload] ❌ GitHub API error:', error)
      debugError('[Upload] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })

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
    }
  }, [token, config, updateTask, queryClient, addOperationLog])

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
        // 开始上传单个文件
        uploadSingleFile(file, taskId)
      })
    },
    [uploadSingleFile]
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
      retryTaskFn(taskId)
      // 重新上传
      addFiles([file])
    }
  }, [getFailedTaskFile, retryTaskFn, addFiles])

  // 重试所有失败任务
  const retryAllFailed = useCallback(() => {
    const failedFiles = getFailedTaskFiles()
    if (failedFiles.length > 0) {
      // 重置所有失败任务
      const failedIds = retryFailedFn()
      // 重新上传所有失败的文件
      addFiles(failedFiles)
      return failedIds.length
    }
    return 0
  }, [getFailedTaskFiles, retryFailedFn, addFiles])

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
  }
}
