import { defineEventHandler } from 'h3'

/**
 * 认证中间件
 * 保护需要登录的 API 路由
 */
export default defineEventHandler(async (event) => {
  // 获取请求路径
  const path = event.node.req.url || ''

  // 允许公开访问的路径
  const publicPaths = [
    '/api/auth/github',
    '/api/auth/callback',
    '/api/auth/verify'
  ]

  // 检查是否为公开路径
  if (publicPaths.some(p => path.startsWith(p))) {
    return
  }

  // 从请求中获取 token
  const token = getTokenFromCookie(event) || getTokenFromHeader(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '未提供认证令牌'
    })
  }

  // 验证 token
  const payload = await verifyToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '认证令牌无效或已过期'
    })
  }

  // 将用户信息附加到事件对象上
  event.context.auth = payload
})
