import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../[...nextauth]/route'

export async function POST() {
  const session = await getServerSession(authOptions)

  if (session) {
    // NextAuth 会自动处理 session 清除
  }

  return NextResponse.json({ success: true })
}
