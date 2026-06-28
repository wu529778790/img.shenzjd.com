import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sha: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      console.error('Delete failed: No session or access token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = session.accessToken as string
    const { sha } = await params
    const body = await request.json()
    const { owner, repo, filePath } = body

    console.log('Delete request:', { owner, repo, filePath, sha: sha.slice(0, 8) + '...' })

    if (!owner || !repo || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 删除文件
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Delete ${filePath} via ImgX`,
          sha,
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('GitHub API delete error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText.slice(0, 500),
      })
      throw new Error(`GitHub API error: ${response.status}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}
