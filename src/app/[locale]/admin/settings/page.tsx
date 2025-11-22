'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Save, Settings } from 'lucide-react'
import type { Locale } from '@/types'

interface Settings {
  timezone: string
  default_language: string
  reminder_enabled: string
  cancel_deadline_hours: string
  booking_range_days: string
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
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

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
      </div>
    </div>
  )
}
