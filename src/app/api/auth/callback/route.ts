import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL('/login?error=access_denied', request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', request.url)
    )
  }

  try {
    // 用 code 换取 access_token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return NextResponse.redirect(
        new URL(`/login?error=${tokenData.error}`, request.url)
      )
    }

    // 获取用户信息
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${tokenData.access_token}`,
      },
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userData = await userResponse.json()

    // 重定向回首页，携带 token 和用户信息
    const redirectUrl = new URL('/', request.url)
    redirectUrl.searchParams.set('token', tokenData.access_token)
    redirectUrl.searchParams.set('user', JSON.stringify(userData))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/login?error=server_error', request.url)
    )
  }
}
