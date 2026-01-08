import { defineEventHandler } from 'h3'

/**
 * 认证中间件
 * 尝试从请求中解析用户信息，但不强制要求认证
 * 让各个 API 端点自己决定如何处理未认证请求
 */
export default defineEventHandler(async (event) => {
  // 获取请求路径
  const path = event.node.req.url || ''

  // 公开路径直接放行
  const publicPaths = [
    '/api/auth/github',
    '/api/auth/callback',
    '/api/auth/verify'
  ]

  if (publicPaths.some(p => path.startsWith(p))) {
    return
  }

  // 尝试从请求中获取 token
  const token = getTokenFromCookie(event) || getTokenFromHeader(event)

  if (token) {
    // 有 token，尝试验证
    const payload = await verifyToken(token)
    if (payload) {
      // token 有效，将用户信息附加到事件对象上
      event.context.auth = payload
    } else {
      // token 无效，标记为未认证
      event.context.auth = null
    }
  } else {
    // 没有 token，标记为未认证
    event.context.auth = null
  }
})
