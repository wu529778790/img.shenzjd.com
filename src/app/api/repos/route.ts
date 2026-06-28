import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(6)

  try {
    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 }, // 缓存 5 分钟
    })

    if (!response.ok) {
      throw new Error('Failed to fetch repos')
    }

    const repos = await response.json()
    return NextResponse.json(repos)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}
