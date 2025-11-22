'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Save, Settings, Mail, Eye, EyeOff } from 'lucide-react'
import type { Locale } from '@/types'

interface Settings {
  timezone: string
  default_language: string
  reminder_enabled: string
  cancel_deadline_hours: string
  booking_range_days: string
  smtp_host: string
  smtp_port: string
  smtp_secure: string
  smtp_user: string
  smtp_pass: string
  smtp_from: string
}

export default function SettingsPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [settings, setSettings] = useState<Settings>({
    timezone: 'Asia/Tokyo',
    default_language: 'ja',
    reminder_enabled: 'true',
    cancel_deadline_hours: '24',
    booking_range_days: '90',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .finally(() => setIsLoading(false))
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      alert(locale === 'en' ? 'Settings saved' : '設定を保存しました')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert(locale === 'en' ? 'Failed to save' : '保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">{locale === 'en' ? 'Loading...' : '読み込み中...'}</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{locale === 'en' ? 'Settings' : '設定'}</h1>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="w-4 h-4 mr-2" />{locale === 'en' ? 'Save' : '保存'}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{locale === 'en' ? 'General' : '一般設定'}</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Timezone' : 'タイムゾーン'}
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              >
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Default Language' : 'デフォルト言語'}
              </label>
              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={settings.default_language}
                onChange={(e) => setSettings({ ...settings, default_language: e.target.value })}
              >
                <option value="ja">{locale === 'en' ? 'Japanese' : '日本語'}</option>
                <option value="en">{locale === 'en' ? 'English' : '英語'}</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">{locale === 'en' ? 'Booking Settings' : '予約設定'}</h2>
          <div className="space-y-4">
            <Input
              label={locale === 'en' ? 'Cancel Deadline (hours before)' : 'キャンセル締切（予約の何時間前）'}
              type="number"
              value={settings.cancel_deadline_hours}
              onChange={(e) => setSettings({ ...settings, cancel_deadline_hours: e.target.value })}
            />
            <Input
              label={locale === 'en' ? 'Booking Range (days)' : '予約可能期間（日数）'}
              type="number"
              value={settings.booking_range_days}
              onChange={(e) => setSettings({ ...settings, booking_range_days: e.target.value })}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">{locale === 'en' ? 'Notifications' : '通知設定'}</h2>
          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.reminder_enabled === 'true'}
                onChange={(e) => setSettings({ ...settings, reminder_enabled: e.target.checked ? 'true' : 'false' })}
                className="w-4 h-4 text-teal-600 rounded"
              />
              <span>{locale === 'en' ? 'Send reminder email (1 day before)' : 'リマインドメールを送信（前日）'}</span>
            </label>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Mail className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{locale === 'en' ? 'Email Settings (SMTP)' : 'メール設定（SMTP）'}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {locale === 'en'
              ? 'Configure SMTP settings to send emails. For Gmail, use smtp.gmail.com and an App Password.'
              : 'メール送信のためのSMTP設定です。Gmailの場合はsmtp.gmail.comとアプリパスワードを使用してください。'}
          </p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={locale === 'en' ? 'SMTP Host' : 'SMTPホスト'}
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
              />
              <Input
                label={locale === 'en' ? 'SMTP Port' : 'SMTPポート'}
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: e.target.value })}
                placeholder="587"
              />
            </div>
            <Input
              label={locale === 'en' ? 'Email Address (SMTP User)' : 'メールアドレス（SMTPユーザー）'}
              type="email"
              value={settings.smtp_user}
              onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
              placeholder="your-email@gmail.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Password (App Password for Gmail)' : 'パスワード（Gmailの場合はアプリパスワード）'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 border rounded-lg pr-10"
                  value={settings.smtp_pass}
                  onChange={(e) => setSettings({ ...settings, smtp_pass: e.target.value })}
                  placeholder="••••••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Input
              label={locale === 'en' ? 'From Address' : '送信元アドレス'}
              value={settings.smtp_from}
              onChange={(e) => setSettings({ ...settings, smtp_from: e.target.value })}
              placeholder="Your Salon <your-email@gmail.com>"
            />
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-blue-700 mb-2">
                {locale === 'en' ? 'Gmail Setup Instructions:' : 'Gmail設定手順:'}
              </p>
              <ol className="list-decimal list-inside text-blue-600 space-y-1">
                <li>{locale === 'en' ? 'Enable 2-Step Verification in your Google Account' : 'Googleアカウントで2段階認証を有効化'}</li>
                <li>{locale === 'en' ? 'Go to App Passwords (myaccount.google.com/apppasswords)' : 'アプリパスワードを作成（myaccount.google.com/apppasswords）'}</li>
                <li>{locale === 'en' ? 'Create a new app password and use it here' : '生成された16文字のパスワードをここに入力'}</li>
              </ol>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
