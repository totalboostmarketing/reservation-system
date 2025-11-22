import { NextRequest, NextResponse } from 'next/server'
import { sendReminderEmails } from '@/lib/email'

// Vercel Cron Jobs または外部サービスから呼び出される
// 前日18時にリマインドメールを送信
export async function GET(request: NextRequest) {
  try {
    // 認証チェック（Vercel Cron または CRON_SECRET を使用）
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // Vercel Cronからの呼び出しの場合
    if (request.headers.get('x-vercel-cron')) {
      // Vercel Cronは認証済み
    } else if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // 外部からの呼び出しの場合は認証が必要
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await sendReminderEmails()

    return NextResponse.json({
      success: true,
      message: `Reminder emails sent: ${result.sent}, failed: ${result.failed}`,
      ...result
    })
  } catch (error) {
    console.error('Cron reminder error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send reminder emails' },
      { status: 500 }
    )
  }
}
