'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { ConfigPrompt } from '@/components/auth/ConfigPrompt'

interface ConfigDialogContextType {
  /** 打开配置引导弹窗 */
  openConfigDialog: () => void
  /** 关闭配置引导弹窗 */
  closeConfigDialog: () => void
  /** 配置弹窗是否打开 */
  isConfigDialogOpen: boolean
  /** 配置弹窗是否被用户关闭过（未配置的情况下） */
  isConfigDismissed: boolean
}

const ConfigDialogContext = createContext<ConfigDialogContextType | null>(null)

interface ConfigDialogProviderProps {
  children: ReactNode
}

/**
 * 配置引导弹窗 Provider
 *
 * 提供全局的配置引导弹窗控制
 * 可以在任何地方打开配置引导弹窗
 *
 * @example
 * // 在 layout.tsx 中包裹应用
 * <ConfigDialogProvider>
 *   {children}
 * </ConfigDialogProvider>
 *
 * @example
 * // 在组件中使用
 * const { openConfigDialog } = useConfigDialog()
 * <Button onClick={openConfigDialog}>去配置</Button>
 */
export function ConfigDialogProvider({ children }: ConfigDialogProviderProps) {
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [isConfigDismissed, setIsConfigDismissed] = useState(false)

  const openConfigDialog = useCallback(() => {
    setIsConfigDialogOpen(true)
    setIsConfigDismissed(false) // 打开弹窗时重置关闭状态
  }, [])

  const closeConfigDialog = useCallback(() => {
    setIsConfigDialogOpen(false)
    setIsConfigDismissed(true) // 标记用户已关闭弹窗
  }, [])

  return (
    <ConfigDialogContext.Provider
      value={{
        openConfigDialog,
        closeConfigDialog,
        isConfigDialogOpen,
        isConfigDismissed,
      }}
    >
      {children}
      <Dialog
        open={isConfigDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsConfigDismissed(true) // 用户关闭弹窗
          }
          setIsConfigDialogOpen(open)
        }}
      >
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md"
        >
          <ConfigPrompt />
        </DialogContent>
      </Dialog>
    </ConfigDialogContext.Provider>
  )
}

/**
 * Hook: 使用配置引导弹窗
 *
 * @example
 * const { openConfigDialog } = useConfigDialog()
 * <Button onClick={openConfigDialog}>去配置</Button>
 */
export function useConfigDialog() {
  const context = useContext(ConfigDialogContext)
  if (!context) {
    throw new Error('useConfigDialog must be used within ConfigDialogProvider')
  }
  return context
}
