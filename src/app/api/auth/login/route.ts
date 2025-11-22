import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      )
    }

    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'アカウントがロックされています。しばらく後にお試しください' },
        { status: 401 }
      )
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = admin.failedAttempts + 1
      const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null

      await prisma.admin.update({
        where: { id: admin.id },
        data: { failedAttempts, lockedUntil }
      })

      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが正しくありません' },
        { status: 401 }
      )
    }

    // Reset failed attempts on successful login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null }
    })

    // Create session token
    const sessionToken = generateSessionToken()

    // Create response with cookie
    const response = NextResponse.json({ success: true })
    response.cookies.set(SESSION_COOKIE_NAME, `${admin.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'ログイン中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
