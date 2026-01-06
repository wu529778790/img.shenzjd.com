import { ofetch } from 'ofetch'

/**
 * GET /api/auth/callback
 * GitHub OAuth 回调处理
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const config = useRuntimeConfig()

  // 1. 获取 code
  const code = query.code as string
  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad Request',
      message: '缺少授权码'
    })
  }

  try {
    // 2. 用 code 换取 access_token
    const tokenResponse = await ofetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code
      }
    })

    if (!tokenResponse.access_token) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Unauthorized',
        message: '获取访问令牌失败'
      })
    }

    const accessToken = tokenResponse.access_token

    // 3. 获取用户信息
    const userResponse = await ofetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    })

    // 4. 获取用户邮箱（如果未在公开信息中）
    let email = userResponse.email
    if (!email) {
      const emails = await ofetch('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      // 获取主邮箱
      const primaryEmail = emails.find((e: any) => e.primary && e.verified)
      email = primaryEmail?.email || emails[0]?.email || ''
    }

    // 5. 生成 JWT Token
    const jwtPayload = {
      id: userResponse.id,
      login: userResponse.login,
      email: email || '',
      avatarUrl: userResponse.avatar_url,
      // 保存 GitHub access token 用于后续 API 调用
      githubToken: accessToken
    }

    const token = await generateToken(jwtPayload)

    // 6. 设置 Cookie 并重定向到首页
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    })

    // 重定向到配置页面
    return sendRedirect(event, '/config')
  } catch (error) {
    console.error('OAuth callback error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: '登录处理失败'
    })
  }
})
