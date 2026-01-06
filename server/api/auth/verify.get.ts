/**
 * GET /api/auth/verify
 * 验证 JWT Token 有效性
 */
export default defineEventHandler(async (event) => {
  const token = getTokenFromCookie(event) || getTokenFromHeader(event)

  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '未提供认证令牌'
    })
  }

  const payload = await verifyToken(token)

  if (!payload) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
      message: '认证令牌无效或已过期'
    })
  }

  // 从 token 中提取 GitHub token
  // 注意：我们不将 GitHub token 存储在 JWT payload 中以提高安全性
  // 而是在需要时通过其他方式获取

  return {
    valid: true,
    user: {
      id: payload.id,
      login: payload.login,
      email: payload.email,
      avatarUrl: payload.avatarUrl
    }
  }
})
