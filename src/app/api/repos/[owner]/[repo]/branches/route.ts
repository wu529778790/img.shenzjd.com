import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../auth/[...nextauth]/route'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      console.error('Branches API: No session or accessToken')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken as string
    const { owner, repo } = await params

    console.log('Fetching branches:', { owner, repo, tokenPrefix: token.substring(0, 10) + '...' })

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    console.log('GitHub branches API response:', { status: response.status, statusText: response.statusText })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub branches API error:', errorText)
      throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`)
    }

    const branches = await response.json()
    console.log('Fetched branches count:', branches.length)
    return NextResponse.json(branches)
  } catch (error) {
    console.error('Fetch branches error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}
