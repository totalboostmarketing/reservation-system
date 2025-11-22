'use client'

import Link from 'next/link'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Calendar,
  ClipboardList,
  Store,
  Menu,
  Users,
  Tag,
  Ticket,
  Mail,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react'

const navigation = [
  { name: '予約一覧', nameEn: 'Reservations', href: '/admin/reservations', icon: ClipboardList },
  { name: 'カレンダー', nameEn: 'Calendar', href: '/admin/calendar', icon: Calendar },
  { name: 'サマリー', nameEn: 'Summary', href: '/admin/summary', icon: BarChart3 },
  { name: '店舗管理', nameEn: 'Stores', href: '/admin/stores', icon: Store },
  { name: 'メニュー管理', nameEn: 'Menus', href: '/admin/menus', icon: Menu },
  { name: 'スタッフ管理', nameEn: 'Staff', href: '/admin/staff', icon: Users },
  { name: 'キャンペーン', nameEn: 'Campaigns', href: '/admin/campaigns', icon: Tag },
  { name: 'クーポン', nameEn: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'メールテンプレート', nameEn: 'Email Templates', href: '/admin/email-templates', icon: Mail },
  { name: '設定', nameEn: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()

  // Get locale from params or extract from pathname, default to 'ja'
  const locale = (params.locale as string) || pathname.split('/')[1] || 'ja'

  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Skip auth check for login page
  const isLoginPage = pathname.includes('/admin/login')

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false)
      return
    }

    // Wait for locale to be available
    if (!locale || locale === 'undefined') {
      return
    }

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (!data.authenticated) {
          router.push(`/${locale}/admin/login`)
          return
        }

        setUser(data.user)
      } catch (error) {
        console.error('Auth check error:', error)
        router.push(`/${locale}/admin/login`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [isLoginPage, locale, router, pathname])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push(`/${locale}/admin/login`)
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Show login page without layout
  if (isLoginPage) {
    return <>{children}</>
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  // Not authenticated - will redirect
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">管理画面</h1>
          {user && (
            <p className="text-sm text-gray-400 mt-1">{user.name}</p>
          )}
        </div>
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname.includes(item.href)
            return (
              <Link
                key={item.href}
                href={`/${locale}${item.href}`}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-teal-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{locale === 'en' ? item.nameEn : item.name}</span>
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>ログアウト</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
