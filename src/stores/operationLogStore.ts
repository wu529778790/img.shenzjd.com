import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OperationLog } from '@/types/image'

interface OperationLogState {
  logs: OperationLog[]
  addLog: (log: Omit<OperationLog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
}

const MAX_LOGS = 100

export const useOperationLogStore = create<OperationLogState>()(
  persist(
    (set) => ({
      logs: [],

      addLog: (log) => {
        set((state) => {
          const newLog: OperationLog = {
            ...log,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
          }
          const updated = [newLog, ...state.logs]
          return {
            logs: updated.length > MAX_LOGS ? updated.slice(0, MAX_LOGS) : updated,
          }
        })
      },

      clearLogs: () => set({ logs: [] }),
    }),
    {
      name: 'operation-log-storage',
    }
  )
)
