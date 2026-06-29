/**
 * 会话检查 Hook - 带错误处理和重试机制
 * 解决 CLIENT_FETCH_ERROR 问题
 */

import { useSession } from 'next-auth/react'
import { useEffect, useState, useCallback } from 'react'

interface UseSessionOptions {
  required?: boolean
  onUnauthenticated?: () => void
  retryCount?: number
  retryDelay?: number
}

/**
 * 增强的会话检查 Hook
 * - 自动重试失败请求
 * - 错误边界处理
 * - 可选的重定向
 */
export function useSessionWithRetry(options: UseSessionOptions = {}) {
  const { required = false, onUnauthenticated, retryCount = 3, retryDelay = 1000 } = options
  const { data: session, status, update } = useSession()
  const [retryAttempt, setRetryAttempt] = useState(0)
  const [fetchError, setFetchError] = useState<Error | null>(null)

  // 带重试的会话更新
  const updateSessionWithRetry = useCallback(async () => {
    try {
      setFetchError(null)
      await update()
      setRetryAttempt(0) // 成功后重置重试计数
    } catch (error: any) {
      console.error('Session update failed:', error)
      setFetchError(error)

      // 自动重试
      if (retryAttempt < retryCount) {
        setTimeout(() => {
          setRetryAttempt((prev) => prev + 1)
        }, retryDelay * (retryAttempt + 1)) // 指数退避
      }
    }
  }, [update, retryAttempt, retryCount, retryDelay])

  // 监听会话状态变化
  useEffect(() => {
    if (status === 'unauthenticated' && required && onUnauthenticated) {
      onUnauthenticated()
    }
  }, [status, required, onUnauthenticated])

  // 有错误时自动重试
  useEffect(() => {
    if (fetchError && retryAttempt < retryCount) {
      const timer = setTimeout(() => {
        updateSessionWithRetry()
      }, retryDelay * (retryAttempt + 1))
      return () => clearTimeout(timer)
    }
  }, [fetchError, retryAttempt, retryCount, retryDelay, updateSessionWithRetry])

  return {
    session,
    status,
    error: fetchError,
    updateSession: updateSessionWithRetry,
    isRetrying: retryAttempt > 0,
    canRetry: retryAttempt < retryCount,
  }
}
