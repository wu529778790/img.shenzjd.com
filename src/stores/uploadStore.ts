import { create } from 'zustand'
import type { UploadTask } from '@/types/image'

interface UploadState {
  queue: UploadTask[]
  addTasks: (files: File[]) => void
  updateTask: (id: string, updates: Partial<UploadTask>) => void
  removeTask: (id: string) => void
  clearQueue: () => void
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],

  addTasks: (files: File[]) => {
    const newTasks: UploadTask[] = files.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'pending',
      progress: 0,
    }))
    set((state) => ({ queue: [...state.queue, ...newTasks] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      queue: state.queue.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      queue: state.queue.filter((task) => task.id !== id),
    }))
  },

  clearQueue: () => {
    set({ queue: [] })
  },
}))
