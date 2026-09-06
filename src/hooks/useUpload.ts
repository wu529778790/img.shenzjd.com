'use client'

import { useCallback, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { compressImage, convertToWebp } from '@/lib/compress'
import { addWatermark } from '@/lib/watermark'
import { useConfigStore } from '@/stores/configStore'
import { useUploadStore } from '@/stores/uploadStore'
import { GitHubAPI } from '@/lib/github'
import { generateLink } from '@/lib/link'
import { getFileCategory, isImage as isImageFile, shouldConvertToWebp } from '@/lib/fileTypes'
import { debugLog, debugError, debugWarn } from '@/lib/debug'
import { ensureReady, tryGetCredential, type CredentialContext } from '@/hooks/useWxAuthSession'
import { invalidateCapabilityToken } from '@/lib/wxauth'
import type { FileWithPreview, LinkOptions, UploadTask } from '@/types/image'

export function useUpload() {
  const queryClient = useQueryClient()
  const config = useConfigStore()
  const { updateTask, removeTask: removeTaskStore, clearQueue, retryFailed: retryFailedFn } = useUploadStore()

  // ✅ 组件卸载时释放所有 blob URL，防止内存泄漏
  useEffect(() => {
    return () => {
      const queue = useUploadStore.getState().queue
      queue.forEach((task) => {
        if (task.file instanceof File) {
          const preview = (task.file as FileWithPreview).preview
          if (preview) {
            URL.revokeObjectURL(preview)
          }
        }
      })
    }
  }, [])

  // 上传单个文件的函数
  const uploadSingleFile = useCallback(async (
    file: File,
    taskId: string,
    cred: CredentialContext
  ): Promise<void> => {
    debugLog('[Upload] Starting upload for:', file.name, {
      owner: cred.owner,
      repo: cred.repo,
      directory: config.directory,
    })

    try {
      // 实时读取最新配置（避免 mutation 闭包捕获旧值）
      const cfg = useConfigStore.getState()
      const api = new GitHubAPI(cred.token, cred.owner, cred.repo, cfg.branch)

      // 1. 压缩图片（仅图片文件使用 Canvas 压缩）
      let processedFile = file
      if (cfg.compressionEnabled && isImageFile(file.name)) {
        try {
          debugLog('[Progress] Setting progress to 10% (compression start)')
          updateTask(taskId, { progress: 10 }) // 压缩开始
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          processedFile = await compressImage(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            initialQuality: cfg.compressionQuality / 100,
          })
          debugLog('[Progress] Setting progress to 20% (compression done)')
          updateTask(taskId, { progress: 20 }) // 压缩完成
          await new Promise(resolve => setTimeout(resolve, 300))
          debugLog('[Upload] Compression completed:', file.name)
        } catch (error) {
          debugError('Compression failed:', error)
          toast.error(`${file.name} 压缩失败，将上传原图`)
        }
      } else if (cfg.compressionEnabled) {
        debugLog('[Upload] Skipping compression (non-image):', file.name)
      }

      // 1.5 转换为 WebP（仅图片文件；SVG/GIF 豁免，见 shouldConvertToWebp）
      if (cfg.convertToWebp && isImageFile(processedFile.name) && shouldConvertToWebp(processedFile.name)) {
        try {
          debugLog('[Upload] Converting to WebP:', processedFile.name)
          updateTask(taskId, { progress: 25 })
          await new Promise(resolve => setTimeout(resolve, 300))
          processedFile = await convertToWebp(processedFile, 1)
          debugLog('[Upload] WebP conversion done:', processedFile.name)
        } catch (error) {
          debugError('[WebP] Conversion failed:', error)
          toast.error(`${file.name} WebP 转换失败，将上传原格式`)
        }
      } else if (cfg.convertToWebp && isImageFile(processedFile.name)) {
        debugLog('[Upload] Skipping WebP conversion (SVG/GIF/WebP):', processedFile.name)
      }

      // 2. 添加水印（仅图片文件）
      if (cfg.watermarkEnabled && cfg.watermarkText && isImageFile(processedFile.name)) {
        try {
          debugLog('[Progress] Setting progress to 30% (watermark start)')
          updateTask(taskId, { progress: 30 }) // 水印开始
          await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示
          const watermarkedBlob = await addWatermark(processedFile, {
            text: cfg.watermarkText,
            color: cfg.watermarkColor,
            size: cfg.watermarkSize,
            position: cfg.watermarkPosition,
          })
          processedFile = new File([watermarkedBlob], processedFile.name, {
            type: processedFile.type,
          })
          debugLog('[Progress] Setting progress to 40% (watermark done)')
          updateTask(taskId, { progress: 40 }) // 水印完成
          await new Promise(resolve => setTimeout(resolve, 300))
          debugLog('[Progress] Watermark added:', file.name)
        } catch (error) {
          debugError('Watermark failed:', error)
          toast.error(`${file.name} 水印添加失败`)
        }
      } else if (cfg.watermarkEnabled && cfg.watermarkText) {
        debugLog('[Upload] Skipping watermark (non-image):', file.name)
      }

      // 3. 生成文件路径（带品牌前缀和可读日期）
      const ext = processedFile.name.split('.').pop()
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      const rand = Math.random().toString(36).slice(2, 6)
      const fileName = cfg.useOriginalFileName
        ? processedFile.name
        : `img.shenzjd.com-${dateStr}-${timeStr}-${rand}.${ext}`
      const filePath = cfg.directory ? `${cfg.directory}/${fileName}` : fileName

      debugLog('[Upload] File path:', filePath)
      debugLog('[Progress] Setting progress to 50% (ready to upload)')
      updateTask(taskId, { progress: 50 }) // 准备上传
      await new Promise(resolve => setTimeout(resolve, 300)) // 延迟显示

      // 4. 上传到 GitHub（浏览器直传，凭证为 wx-auth 签发的短命 installation token）
      debugLog('[Upload] Starting GitHub upload...', { owner: cred.owner, repo: cred.repo })
      debugLog('[Upload] Target branch:', cfg.branch)
      const commitMessage = `[skip ci] upload by https://img.shenzjd.com`
      const onProgress = (progress: number) => {
        // 实时更新上传进度 (50% -> 90%)
        const totalProgress = 50 + Math.round(progress * 0.4)
        debugLog('[Progress] GitHub callback progress:', progress, '-> total:', totalProgress, 'for task:', taskId)
        updateTask(taskId, { progress: totalProgress })
      }
      const branch = cfg.branch || 'main'

      const doUpload = (target: GitHubAPI) =>
        target.createOrUpdateFile(filePath, processedFile, commitMessage, branch, onProgress)

      let result
      try {
        result = await doUpload(api)
      } catch (uploadErr) {
        // installation token 过期（401）→ 失效缓存重领一次后重试
        const status = (uploadErr as { response?: { status?: number } })?.response?.status
        if (status !== 401) throw uploadErr
        debugWarn('[Upload] Token expired (401), refreshing capability token once')
        invalidateCapabilityToken()
        const freshCred = await tryGetCredential()
        if (!freshCred) throw uploadErr
        result = await doUpload(new GitHubAPI(freshCred.token, freshCred.owner, freshCred.repo, branch))
      }

      debugLog('[Upload] GitHub upload result:', result)
      debugLog('[Progress] Setting progress to 90% (GitHub upload done)')
      updateTask(taskId, { progress: 90 }) // GitHub 上传完成

      // GitHub API 可能有延迟，等待一下让文件同步
      debugLog('[Upload] Waiting 1 second for GitHub to sync...')
      await new Promise(resolve => setTimeout(resolve, 1000))

      // 尝试验证文件是否创建成功（不阻塞流程）
      debugLog('[Upload] Attempting to verify file...')
      try {
        await api.getFile(filePath, branch)
        debugLog('[Upload] File verified successfully')
      } catch (verifyErr) {
        // 验证失败只记录警告，不阻塞上传流程
        const message = verifyErr instanceof Error ? verifyErr.message : String(verifyErr)
        debugWarn('[Upload] Verification skipped (GitHub API delay):', message)
      }

      debugLog('[Upload] ✅ Upload completed successfully:', fileName)
      debugLog('[Upload] File URL:', result.html_url)

      // 生成缩略图 blob URL（仅图片文件生成 blob 预览）
      const thumbnailUrl = isImageFile(processedFile.name)
        ? URL.createObjectURL(processedFile)
        : undefined

      // 生成链接并自动复制到剪贴板
      // 按文件类型分支：图片保留原有 WebP / <img> 行为，其他文件使用裸链 / <a>
      const linkOptions: LinkOptions = {
        format: cfg.copyFormat,
        cdn: cfg.cdn,
        owner: cred.owner,
        repo: cred.repo,
        branch,
        path: filePath,
        fileName: fileName,
        useRaw: cfg.useRaw ?? true,
        category: getFileCategory(fileName),
      }

      const link = generateLink(linkOptions)

      // 上传成功
      debugLog('[Progress] Setting progress to 100% (upload complete)')
      updateTask(taskId, {
        status: 'success',
        progress: 100,
        thumbnailUrl,
        link,
      })

      // 如果启用了自动复制，复制链接到剪贴板
      if (cfg.autoCopyAfterUpload) {
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

      // 延迟刷新图片列表，给 GitHub tree API 最终一致性留出时间
      // GitHub commit 成功后 tree 需要几秒才能反映新文件
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['images'] })
      }, 2000)
    } catch (error) {
      debugError('[Upload] ❌ GitHub API error:', error)
      const err = error as { message?: string; response?: { data?: unknown; status?: number } }
      debugError('[Upload] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      })

      updateTask(taskId, {
        status: 'error',
        progress: 0,
        error: err.response?.status === 404
          ? '图床仓库不存在，请重新登录并初始化'
          : (err.message ?? 'Upload failed'),
      })
    }
  }, [config, updateTask, queryClient])

  // 添加文件到上传队列（支持预览）
  const addFiles = useCallback(
    async (files: File[]) => {
      // wx-auth 就绪流程：登录 → GitHub 绑定/安装/开通引导 → 领取上传凭证
      // 每次上传会话判定一次，结果缓存在前端会话内
      let cred: CredentialContext
      try {
        cred = await ensureReady()
      } catch (err) {
        const message = err instanceof Error ? err.message : '登录/授权未完成，请稍后重试'
        debugWarn('[Upload] Not ready:', err)
        toast.error(message)
        return
      }

      // 为每个文件创建任务，为图片文件添加预览
      const newTasks: UploadTask[] = files.map((file) => {
        const task: UploadTask = {
          id: Math.random().toString(36).substring(7),
          file,
          status: 'pending',
          progress: 0,
        }

        // 为图片文件添加预览
        if (file.type.startsWith('image/')) {
          const previewFile = file as FileWithPreview
          if (!previewFile.preview) {
            previewFile.preview = URL.createObjectURL(file)
          }
        }

        return task
      })

      // 直接添加到 store，taskId 保持一致性
      // ✅ zustand v5: 直接调用 hook.setState()
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
        uploadSingleFile(file, taskId, cred)
      })
    },
    [uploadSingleFile, updateTask]
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
    const task = useUploadStore.getState().queue.find((t) => t.id === taskId)
    if (task && task.file) {
      return task.file
    }
    return null
  }, [])

  // 重试单个失败任务
  const retryTask = useCallback((taskId: string) => {
    const file = getFailedTaskFile(taskId)
    if (file) {
      // ✅ 先移除旧任务（store 会释放 blob URL），避免队列中残留
      removeTaskStore(taskId)
      // 重新上传（addFiles 会为同一 file 对象复用已有 blob URL）
      addFiles([file])
    }
  }, [getFailedTaskFile, removeTaskStore, addFiles])

  // 重试所有失败任务
  const retryAllFailed = useCallback(() => {
    const failedFiles = getFailedTaskFiles()
    if (failedFiles.length > 0) {
      // ✅ 先移除所有失败的文件（store 会释放 blob URL）
      const failedIds = retryFailedFn()
      failedIds.forEach((id) => removeTaskStore(id))
      // 重新上传所有失败的文件
      addFiles(failedFiles)
      return failedIds.length
    }
    return 0
  }, [getFailedTaskFiles, retryFailedFn, removeTaskStore, addFiles])

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
