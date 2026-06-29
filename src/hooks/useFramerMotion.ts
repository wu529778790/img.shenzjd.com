import { useState, useEffect } from 'react'

/**
 * 动态导入 framer-motion，仅在客户端加载
 * 这样可以减少首屏 JS 体积约 80KB
 */
export function useFramerMotion() {
  const [framer, setFramer] = useState<{
    motion: any // framer-motion motion 组件
    AnimatePresence: any
  } | null>(null)

  useEffect(() => {
    let mounted = true
    import('framer-motion').then((mod) => {
      if (mounted) {
        setFramer({
          motion: mod.motion,
          AnimatePresence: mod.AnimatePresence,
        })
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  return framer
}
