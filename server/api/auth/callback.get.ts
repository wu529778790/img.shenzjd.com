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

    // 6. 设置 Cookie
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 天
    })

    // 检查是否在弹窗中（通过 referer 或 query 参数）
    const referer = getRequestHeader(event, 'referer') || ''
    const isPopup = getQuery(event).popup === 'true' || referer.includes('popup=true')

    if (isPopup) {
      // 返回一个 HTML 页面，通过 postMessage 通知父窗口
      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>登录成功</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 24px;
    }
    p {
      margin: 0;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">✓</div>
    <h1>登录成功</h1>
    <p>正在关闭窗口...</p>
  </div>
  <script>
    // 通知父窗口登录成功
    if (window.opener) {
      window.opener.postMessage({
        type: 'oauth-callback',
        success: true,
        user: {
          id: ${userResponse.id},
          login: ${JSON.stringify(userResponse.login)},
          email: ${JSON.stringify(email || '')},
          avatarUrl: ${JSON.stringify(userResponse.avatar_url)}
        }
      }, '*');
      
      // 延迟关闭，确保消息已发送
      setTimeout(() => {
        window.close();
      }, 500);
    } else {
      // 如果不在弹窗中，重定向到首页
      window.location.href = '/';
    }
  </script>
</body>
</html>`
      
      setHeader(event, 'Content-Type', 'text/html; charset=utf-8')
      return html
    }

    // 非弹窗模式：重定向到配置页面
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
