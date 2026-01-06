/**
 * POST /api/auth/logout
 * 退出登录
 */
export default defineEventHandler((event) => {
  // 清除认证 Cookie
  deleteCookie(event, 'auth_token')

  return {
    success: true,
    message: '已退出登录'
  }
})
