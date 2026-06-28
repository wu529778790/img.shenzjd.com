import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const authHeader = request.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('token ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = authHeader.substring(6)
  const { owner, repo } = await params

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch branches')
    }

    const branches = await response.json()
    return NextResponse.json(branches)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    )
  }
}
