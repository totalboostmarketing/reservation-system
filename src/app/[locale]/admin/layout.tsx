'use client'

import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
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
  const locale = params.locale as string

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold">管理画面</h1>
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
      </aside>

      {/* Main content */}
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
