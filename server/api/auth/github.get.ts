/**
 * GET /api/auth/github
 * 重定向到 GitHub 授权页面
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  const clientId = config.github.clientId
  // 构建完整的回调 URL
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = getRequestHeader(event, 'host') || 'localhost:3000'
  const redirectUri = `${protocol}://${host}/api/auth/callback`

  // 构建 GitHub 授权 URL
  const authUrl = `https://github.com/login/oauth/authorize?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=repo,workflow,user:email`

  // 重定向到 GitHub 授权页面
  return sendRedirect(event, authUrl)
})
