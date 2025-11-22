import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: session
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'セッション確認中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
