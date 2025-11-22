import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const SESSION_COOKIE_NAME = 'admin_session'

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const [adminId] = sessionCookie.value.split(':')

    if (!adminId) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, role: true }
    })

    if (!admin) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: admin
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'セッション確認中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
