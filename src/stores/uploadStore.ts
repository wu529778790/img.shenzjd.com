import { create } from 'zustand'
import { produce } from 'immer'
import type { UploadTask } from '@/types/image'

interface UploadState {
  queue: UploadTask[]
  addTasks: (files: File[]) => void
  updateTask: (id: string, updates: Partial<UploadTask>) => void
  removeTask: (id: string) => void
  clearQueue: () => void
  retryTask: (id: string) => void
  retryFailed: () => string[]
}

export const useUploadStore = create<UploadState>((set) => ({
  queue: [],

  addTasks: (files: File[]) => {
    // ✅ 使用 immer 优化批量添加性能
    set(
      produce((state: UploadState) => {
        const newTasks: UploadTask[] = files.map((file) => ({
          id: Math.random().toString(36).substring(7),
          file,
          status: 'pending',
          progress: 0,
        }))
        state.queue.push(...newTasks)
      })
    )
  },

  updateTask: (id, updates) => {
    // ✅ 使用 immer 进行高性能不可变更新
    // 只更新单个任务，避免全量数组 map
    set(
      produce((state: UploadState) => {
        const task = state.queue.find((t) => t.id === id)
        if (task) {
          Object.assign(task, updates)
        }
      })
    )
  },

  removeTask: (id) => {
    // ✅ 使用 immer 过滤数组
    set(
      produce((state: UploadState) => {
        const index = state.queue.findIndex((t) => t.id === id)
        if (index !== -1) {
          state.queue.splice(index, 1)
        }
      })
    )
  },

  clearQueue: () => {
    set({ queue: [] })
  },

  retryTask: (id: string) => {
    // ✅ 使用 immer 更新单个任务状态
    set(
      produce((state: UploadState) => {
        const task = state.queue.find((t) => t.id === id)
        if (task && task.status === 'error') {
          task.status = 'pending'
          task.progress = 0
          task.error = undefined
        }
      })
    )
  },

  retryFailed: () => {
    const failedIds: string[] = []
    // ✅ 使用 immer 批量更新失败任务
    set(
      produce((state: UploadState) => {
        state.queue.forEach((task) => {
          if (task.status === 'error') {
            failedIds.push(task.id)
            task.status = 'pending'
            task.progress = 0
            task.error = undefined
          }
        })
      })
    )
    return failedIds
  },
}))
