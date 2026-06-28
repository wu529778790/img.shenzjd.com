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
    const { sha: pathSha } = await params
    const body = await request.json()
    const { owner, repo, filePath } = body

    console.log('Delete request:', { owner, repo, filePath, pathSha: pathSha.slice(0, 8) + '...' })

    if (!owner || !repo || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 先获取文件当前信息以获取正确的 SHA（处理 SHA 过期问题）
    let currentSha = pathSha
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      )
      if (fileResponse.ok) {
        const fileData = await fileResponse.json()
        currentSha = fileData.sha
        console.log('Fetched current file SHA:', currentSha.slice(0, 8) + '...')
      } else {
        console.warn('Could not fetch file for SHA refresh, using provided SHA')
      }
    } catch (e) {
      console.warn('Error fetching file SHA, using provided SHA:', e)
    }

    // 删除文件
    const deleteResponse = await fetch(
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
          sha: currentSha,
        }),
      }
    )

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error('GitHub API delete error:', {
        status: deleteResponse.status,
        statusText: deleteResponse.statusText,
        body: errorText.slice(0, 500),
      })
      throw new Error(`GitHub API error: ${deleteResponse.status}`)
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
