import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/route'

export async function GET(request: Request) { // eslint-disable-line @typescript-eslint/no-unused-vars
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      user: {
        login: session.user.name || session.user.email,
        name: session.user.name,
        email: session.user.email,
        avatar_url: session.user.image,
        id: session.user.id,
      },
    })
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
