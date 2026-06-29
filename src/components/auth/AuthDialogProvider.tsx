'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { LoginDialog } from '@/components/auth/LoginDialog'

interface AuthDialogContextType {
  /** 打开登录弹窗 */
  openLoginDialog: () => void
  /** 关闭登录弹窗 */
  closeLoginDialog: () => void
  /** 登录弹窗是否打开 */
  isLoginDialogOpen: boolean
}

const AuthDialogContext = createContext<AuthDialogContextType | null>(null)

interface AuthDialogProviderProps {
  children: ReactNode
}

/**
 * 认证弹窗 Provider
 *
 * 提供全局的登录弹窗控制
 * 可以在任何地方打开登录弹窗，无需页面跳转
 *
 * @example
 * // 在 layout.tsx 中包裹应用
 * <AuthDialogProvider>
 *   {children}
 * </AuthDialogProvider>
 *
 * @example
 * // 在组件中使用
 * const { openLoginDialog } = useAuthDialog()
 * <Button onClick={openLoginDialog}>登录</Button>
 */
export function AuthDialogProvider({ children }: AuthDialogProviderProps) {
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false)

  const openLoginDialog = useCallback(() => {
    setIsLoginDialogOpen(true)
  }, [])

  const closeLoginDialog = useCallback(() => {
    setIsLoginDialogOpen(false)
  }, [])

  return (
    <AuthDialogContext.Provider
      value={{
        openLoginDialog,
        closeLoginDialog,
        isLoginDialogOpen,
      }}
    >
      {children}
      <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
        <DialogContent
          showCloseButton={true}
          className="sm:max-w-md"
        >
          <LoginDialog />
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  )
}

/**
 * Hook: 使用认证弹窗
 *
 * @example
 * const { openLoginDialog } = useAuthDialog()
 * <Button onClick={openLoginDialog}>登录</Button>
 */
export function useAuthDialog() {
  const context = useContext(AuthDialogContext)
  if (!context) {
    throw new Error('useAuthDialog must be used within AuthDialogProvider')
  }
  return context
}
