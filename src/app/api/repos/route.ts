import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      console.error('No session or accessToken:', { hasSession: !!session, hasToken: !!session?.accessToken })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken as string

    console.log('Fetching repos with token:', token.substring(0, 10) + '...')

    const response = await fetch('https://api.github.com/user/repos', {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 }, // 缓存 5 分钟
    })

    console.log('GitHub API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API error:', errorText)
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`)
    }

    const repos = await response.json()
    console.log('Fetched repos count:', repos.length)
    return NextResponse.json(repos)
  } catch (error) {
    console.error('Fetch repos error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch repos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken as string
    const body = await request.json()
    const { name, description, private: isPrivate } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Repository name is required' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: description || 'ImgX image host',
        private: isPrivate || false,
        auto_init: true,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to create repo')
    }

    const repo = await response.json()
    return NextResponse.json(repo)
  } catch (error) {
    console.error('Create repo error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create repo' },
      { status: 500 }
    )
  }
}
