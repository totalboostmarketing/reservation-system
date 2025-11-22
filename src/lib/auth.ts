import { cookies } from 'next/headers'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email }
    })

    if (!admin) {
      return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' }
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      return { success: false, error: 'アカウントがロックされています。しばらく後にお試しください' }
    }

    const isValidPassword = await bcrypt.compare(password, admin.password)

    if (!isValidPassword) {
      // Increment failed attempts
      const failedAttempts = admin.failedAttempts + 1
      const lockedUntil = failedAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null // Lock for 30 minutes after 5 failures

      await prisma.admin.update({
        where: { id: admin.id },
        data: { failedAttempts, lockedUntil }
      })

      return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' }
    }

    // Reset failed attempts on successful login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { failedAttempts: 0, lockedUntil: null }
    })

    // Create session token
    const sessionToken = generateSessionToken()

    // Store session in cookie
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE_NAME, `${admin.id}:${sessionToken}`, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/'
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'ログイン中にエラーが発生しました' }
  }
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie?.value) {
      return null
    }

    const [adminId] = sessionCookie.value.split(':')

    if (!adminId) {
      return null
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, email: true, name: true, role: true }
    })

    return admin
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

export async function requireAuth(): Promise<{ id: string; email: string; name: string; role: string }> {
  const session = await getSession()
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}

function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return token
}
