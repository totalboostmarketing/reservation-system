'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Save, Settings, Mail, Eye, EyeOff, User } from 'lucide-react'
import type { Locale } from '@/types'

interface Settings {
  timezone: string
  default_language: string
  reminder_enabled: string
  cancel_deadline_hours: string
  booking_range_days: string
  notification_email: string
}

interface AdminAccount {
  email: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
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
    notification_email: '',
  })
  const [adminAccount, setAdminAccount] = useState<AdminAccount>({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingAdmin, setIsSavingAdmin] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings').then((r) => r.json()),
      fetch('/api/admin/account').then((r) => r.json()),
    ])
      .then(([settingsData, accountData]) => {
        setSettings((prev) => ({ ...prev, ...settingsData }))
        if (accountData.email) {
          setAdminAccount((prev) => ({ ...prev, email: accountData.email }))
        }
      })
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

  const handleSaveAdmin = async () => {
    // バリデーション
    if (adminAccount.newPassword && adminAccount.newPassword !== adminAccount.confirmPassword) {
      alert(locale === 'en' ? 'New passwords do not match' : '新しいパスワードが一致しません')
      return
    }
    if (adminAccount.newPassword && !adminAccount.currentPassword) {
      alert(locale === 'en' ? 'Please enter current password' : '現在のパスワードを入力してください')
      return
    }

    setIsSavingAdmin(true)
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminAccount.email,
          currentPassword: adminAccount.currentPassword,
          newPassword: adminAccount.newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || (locale === 'en' ? 'Failed to save' : '保存に失敗しました'))
        return
      }
      alert(locale === 'en' ? 'Account updated' : 'アカウント情報を更新しました')
      setAdminAccount((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
    } catch (error) {
      console.error('Failed to save admin account:', error)
      alert(locale === 'en' ? 'Failed to save' : '保存に失敗しました')
    } finally {
      setIsSavingAdmin(false)
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
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">{locale === 'en' ? 'Admin Account' : '管理者アカウント'}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {locale === 'en'
              ? 'Change your login email and password.'
              : 'ログイン用のメールアドレスとパスワードを変更できます。'}
          </p>
          <div className="space-y-4">
            <Input
              label={locale === 'en' ? 'Login Email' : 'ログインメールアドレス'}
              type="email"
              value={adminAccount.email}
              onChange={(e) => setAdminAccount({ ...adminAccount, email: e.target.value })}
              placeholder="admin@example.com"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'Current Password' : '現在のパスワード'}
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 border rounded-lg pr-10"
                  value={adminAccount.currentPassword}
                  onChange={(e) => setAdminAccount({ ...adminAccount, currentPassword: e.target.value })}
                  placeholder={locale === 'en' ? 'Required to change password' : 'パスワード変更時に必要'}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === 'en' ? 'New Password' : '新しいパスワード'}
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="w-full px-4 py-2 border rounded-lg pr-10"
                  value={adminAccount.newPassword}
                  onChange={(e) => setAdminAccount({ ...adminAccount, newPassword: e.target.value })}
                  placeholder={locale === 'en' ? 'Leave blank to keep current' : '変更しない場合は空欄'}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Input
              label={locale === 'en' ? 'Confirm New Password' : '新しいパスワード（確認）'}
              type="password"
              value={adminAccount.confirmPassword}
              onChange={(e) => setAdminAccount({ ...adminAccount, confirmPassword: e.target.value })}
              placeholder={locale === 'en' ? 'Re-enter new password' : '新しいパスワードを再入力'}
            />
            <div className="pt-2">
              <Button onClick={handleSaveAdmin} isLoading={isSavingAdmin}>
                <Save className="w-4 h-4 mr-2" />{locale === 'en' ? 'Update Account' : 'アカウント更新'}
              </Button>
            </div>
          </div>
        </Card>

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
            <h2 className="text-lg font-semibold">{locale === 'en' ? 'Email Settings' : 'メール設定'}</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            {locale === 'en'
              ? 'Set the email address to receive reservation notifications.'
              : '予約通知を受信するメールアドレスを設定してください。'}
          </p>
          <div className="space-y-4">
            <Input
              label={locale === 'en' ? 'Notification Email Address' : '通知メールアドレス'}
              type="email"
              value={settings.notification_email}
              onChange={(e) => setSettings({ ...settings, notification_email: e.target.value })}
              placeholder="your-email@example.com"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
