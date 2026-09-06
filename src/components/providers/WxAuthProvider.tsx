'use client'

import { useWxAuthSession } from '@/hooks/useWxAuthSession'

/**
 * wx-auth 会话引导：挂载时静默校验登录态并拉取 GitHub 能力状态。
 * 会话状态模块级共享，页面/上传/列表通过 useWxAuthSession() 消费。
 */
export function WxAuthProvider() {
  useWxAuthSession()
  return null
}
