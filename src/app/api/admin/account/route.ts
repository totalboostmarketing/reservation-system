import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

// 現在のログインユーザーのIDを取得
async function getCurrentAdminId(): Promise<string | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie?.value) return null

  const [adminId] = sessionCookie.value.split(':')
  return adminId || null
}

// GET: 現在のアカウント情報を取得
export async function GET() {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: { email: true, name: true },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    return NextResponse.json(admin)
  } catch (error) {
    console.error('Failed to get admin account:', error)
    return NextResponse.json({ error: 'Failed to get account' }, { status: 500 })
  }
}

// PUT: アカウント情報を更新
export async function PUT(request: Request) {
  try {
    const adminId = await getCurrentAdminId()
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, currentPassword, newPassword } = body

    // 現在の管理者を取得
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    })

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    // 更新データを準備
    const updateData: { email?: string; password?: string } = {}

    // メールアドレスの更新
    if (email && email !== admin.email) {
      // 重複チェック
      const existing = await prisma.admin.findUnique({
        where: { email },
      })
      if (existing) {
        return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 400 })
      }
      updateData.email = email
    }

    // パスワードの更新
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: '現在のパスワードを入力してください' }, { status: 400 })
      }

      // 現在のパスワードを検証
      const isValid = await bcrypt.compare(currentPassword, admin.password)
      if (!isValid) {
        return NextResponse.json({ error: '現在のパスワードが正しくありません' }, { status: 400 })
      }

      // 新しいパスワードをハッシュ化
      updateData.password = await bcrypt.hash(newPassword, 10)
    }

    // 更新がある場合のみ実行
    if (Object.keys(updateData).length > 0) {
      await prisma.admin.update({
        where: { id: adminId },
        data: updateData,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update admin account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}
