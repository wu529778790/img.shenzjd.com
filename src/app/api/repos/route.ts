import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      console.error('Repos API: No session or accessToken')
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

    console.log('GitHub repos API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub repos API error:', errorText)
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`)
    }

    const repos = await response.json()
    console.log('Fetched repos count:', repos.length)
    console.log('First 5 repos:', repos.slice(0, 5).map((r: any) => ({ name: r.name, full_name: r.full_name, private: r.private })))

    // 过滤并标准化 repo 数据
    const standardizedRepos = repos.map((repo: any) => ({
      name: repo.name,
      full_name: repo.full_name,
      private: repo.private,
      owner: repo.owner?.login,
    }))

    return NextResponse.json(standardizedRepos)
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
