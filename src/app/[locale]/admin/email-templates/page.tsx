'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Edit2, Mail, Plus, Trash2, HelpCircle, X, Copy, Check } from 'lucide-react'
import type { Locale } from '@/types'

interface EmailTemplate {
  id: string
  type: string
  language: string
  subject: string
  bodyHtml: string
  bodyText: string
  isActive: boolean
}

const templateTypes = {
  reservation_complete: { ja: '予約完了', en: 'Reservation Complete' },
  reservation_change: { ja: '予約変更', en: 'Reservation Changed' },
  reservation_cancel: { ja: '予約キャンセル', en: 'Reservation Cancelled' },
  reminder: { ja: 'リマインド', en: 'Reminder' },
}

const availableVariables = [
  { key: '{{customerName}}', ja: 'お客様のお名前', en: 'Customer name' },
  { key: '{{storeName}}', ja: '店舗名', en: 'Store name' },
  { key: '{{menuName}}', ja: 'メニュー名', en: 'Menu name' },
  { key: '{{staffName}}', ja: 'スタッフ名', en: 'Staff name' },
  { key: '{{dateTime}}', ja: '予約日時', en: 'Reservation date/time' },
  { key: '{{cancelUrl}}', ja: 'キャンセルURL', en: 'Cancel URL' },
  { key: '{{reservationId}}', ja: '予約ID', en: 'Reservation ID' },
]

const sampleTemplates = {
  reservation_complete: {
    ja: {
      subject: '【{{storeName}}】ご予約ありがとうございます',
      bodyText: `{{customerName}} 様

この度は{{storeName}}をご予約いただき、誠にありがとうございます。

【ご予約内容】
店舗: {{storeName}}
メニュー: {{menuName}}
{{#if staffName}}担当: {{staffName}}{{else}}担当: 指名なし{{/if}}
日時: {{dateTime}}

ご予約のキャンセル・変更は下記URLより可能です。
{{cancelUrl}}

ご来店を心よりお待ちしております。`
    },
    en: {
      subject: '[{{storeName}}] Thank you for your reservation',
      bodyText: `Dear {{customerName}},

Thank you for booking with {{storeName}}.

Reservation Details:
Store: {{storeName}}
Menu: {{menuName}}
{{#if staffName}}Staff: {{staffName}}{{else}}Staff: Not specified{{/if}}
Date/Time: {{dateTime}}

To cancel or modify your reservation, please visit:
{{cancelUrl}}

We look forward to seeing you!`
    }
  },
  reservation_cancel: {
    ja: {
      subject: '【{{storeName}}】予約キャンセルのお知らせ',
      bodyText: `{{customerName}} 様

下記のご予約がキャンセルされました。

【キャンセルされた予約】
店舗: {{storeName}}
メニュー: {{menuName}}
日時: {{dateTime}}

またのご利用を心よりお待ちしております。`
    },
    en: {
      subject: '[{{storeName}}] Reservation Cancelled',
      bodyText: `Dear {{customerName}},

Your reservation has been cancelled.

Cancelled Reservation:
Store: {{storeName}}
Menu: {{menuName}}
Date/Time: {{dateTime}}

We hope to see you again soon!`
    }
  },
  reminder: {
    ja: {
      subject: '【{{storeName}}】明日のご予約リマインド',
      bodyText: `{{customerName}} 様

明日のご予約についてお知らせいたします。

【ご予約内容】
店舗: {{storeName}}
メニュー: {{menuName}}
{{#if staffName}}担当: {{staffName}}{{else}}担当: 指名なし{{/if}}
日時: {{dateTime}}

ご予約の変更・キャンセルは下記URLより可能です。
{{cancelUrl}}

お会いできることを楽しみにしております。`
    },
    en: {
      subject: '[{{storeName}}] Reminder: Your appointment tomorrow',
      bodyText: `Dear {{customerName}},

This is a reminder about your appointment tomorrow.

Reservation Details:
Store: {{storeName}}
Menu: {{menuName}}
{{#if staffName}}Staff: {{staffName}}{{else}}Staff: Not specified{{/if}}
Date/Time: {{dateTime}}

To modify or cancel your reservation, please visit:
{{cancelUrl}}

We look forward to seeing you!`
    }
  }
}

export default function EmailTemplatesPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGuideOpen, setIsGuideOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [isNewTemplate, setIsNewTemplate] = useState(false)
  const [copiedVar, setCopiedVar] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: 'reservation_complete',
    language: 'ja',
    subject: '',
    bodyText: '',
    isActive: true
  })

  // テキストからHTMLを自動生成
  const textToHtml = (text: string): string => {
    return text
      .split('\n\n')
      .map(paragraph => {
        const lines = paragraph.split('\n')
        if (lines.length > 1) {
          return `<p>${lines.join('<br>\n')}</p>`
        }
        return `<p>${paragraph}</p>`
      })
      .join('\n')
      .replace(/{{/g, '{{')
      .replace(/}}/g, '}}')
  }

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/admin/email-templates')
      setTemplates(await res.json())
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchTemplates() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // テキストからHTMLを自動生成
    const submitData = {
      ...formData,
      bodyHtml: textToHtml(formData.bodyText)
    }

    if (isNewTemplate) {
      await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
    } else if (editingTemplate) {
      await fetch(`/api/admin/email-templates/${editingTemplate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      })
    }

    setIsModalOpen(false)
    setEditingTemplate(null)
    setIsNewTemplate(false)
    fetchTemplates()
  }

  const handleEdit = (t: EmailTemplate) => {
    setEditingTemplate(t)
    setIsNewTemplate(false)
    setFormData({
      type: t.type,
      language: t.language,
      subject: t.subject,
      bodyText: t.bodyText,
      isActive: t.isActive
    })
    setIsModalOpen(true)
  }

  const handleNew = () => {
    setEditingTemplate(null)
    setIsNewTemplate(true)
    setFormData({
      type: 'reservation_complete',
      language: 'ja',
      subject: '',
      bodyText: '',
      isActive: true
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure you want to delete this template?' : 'このテンプレートを削除しますか？')) {
      return
    }
    await fetch(`/api/admin/email-templates/${id}`, {
      method: 'DELETE',
    })
    fetchTemplates()
  }

  const copyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable)
    setCopiedVar(variable)
    setTimeout(() => setCopiedVar(null), 2000)
  }

  const applySampleTemplate = () => {
    const sample = sampleTemplates[formData.type as keyof typeof sampleTemplates]
    if (sample) {
      const langSample = sample[formData.language as 'ja' | 'en']
      if (langSample) {
        setFormData({
          ...formData,
          subject: langSample.subject,
          bodyText: langSample.bodyText
        })
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{locale === 'en' ? 'Email Templates' : 'メールテンプレート'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {locale === 'en' ? 'Manage automated email notifications' : '自動送信メールの管理'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsGuideOpen(true)}>
            <HelpCircle className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Guide' : '使い方ガイド'}
          </Button>
          <Button onClick={handleNew}>
            <Plus className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Add Template' : 'テンプレートを追加'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'Loading...' : '読み込み中...'}</Card>
        ) : templates.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'No templates' : 'テンプレートがありません'}</Card>
        ) : (
          templates.map((t) => (
            <Card key={t.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                    {templateTypes[t.type as keyof typeof templateTypes]?.[locale] || t.type}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    {t.language.toUpperCase()}
                  </span>
                  {!t.isActive && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">{locale === 'en' ? 'Inactive' : '非公開'}</span>}
                </div>
                <h3 className="font-semibold">{t.subject}</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{t.bodyText.substring(0, 100)}...</p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(t.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Guide Modal */}
      {isGuideOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {locale === 'en' ? 'Email Template Guide' : 'メールテンプレート作成ガイド'}
              </h2>
              <button onClick={() => setIsGuideOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Overview */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '1. Overview' : '1. 概要'}
                </h3>
                <p className="text-gray-600">
                  {locale === 'en'
                    ? 'Email templates are used to automatically send notifications to customers. You can customize the content for different situations like reservation confirmation, cancellation, etc.'
                    : 'メールテンプレートは、お客様への自動通知メールに使用されます。予約完了、キャンセルなど、状況に応じた内容をカスタマイズできます。'}
                </p>
              </section>

              {/* Template Types */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '2. Template Types' : '2. テンプレートタイプ'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">{locale === 'en' ? 'Type' : 'タイプ'}</th>
                        <th className="text-left py-2">{locale === 'en' ? 'When Sent' : '送信タイミング'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">{locale === 'en' ? 'Reservation Complete' : '予約完了'}</td>
                        <td className="py-2 text-gray-600">{locale === 'en' ? 'When a reservation is confirmed' : '予約が確定した時'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">{locale === 'en' ? 'Reservation Changed' : '予約変更'}</td>
                        <td className="py-2 text-gray-600">{locale === 'en' ? 'When reservation details are modified' : '予約内容が変更された時'}</td>
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">{locale === 'en' ? 'Reservation Cancelled' : '予約キャンセル'}</td>
                        <td className="py-2 text-gray-600">{locale === 'en' ? 'When a reservation is cancelled' : '予約がキャンセルされた時'}</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">{locale === 'en' ? 'Reminder' : 'リマインド'}</td>
                        <td className="py-2 text-gray-600">{locale === 'en' ? 'Before the reservation date' : '予約日の前日など'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Variables */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '3. Available Variables' : '3. 利用可能な変数'}
                </h3>
                <p className="text-gray-600 mb-3">
                  {locale === 'en'
                    ? 'Use these variables in your templates. They will be automatically replaced with actual values when the email is sent.'
                    : '以下の変数をテンプレート内で使用できます。メール送信時に実際の値に自動置換されます。'}
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid gap-2">
                    {availableVariables.map((v) => (
                      <div key={v.key} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div>
                          <code className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{v.key}</code>
                          <span className="text-gray-600 ml-3 text-sm">{v[locale]}</span>
                        </div>
                        <button
                          onClick={() => copyVariable(v.key)}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title={locale === 'en' ? 'Copy' : 'コピー'}
                        >
                          {copiedVar === v.key ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* HTML vs Text */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '4. HTML vs Text' : '4. HTML形式とテキスト形式'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <h4 className="font-medium">{locale === 'en' ? 'HTML Body' : '本文（HTML）'}</h4>
                    <p className="text-sm text-gray-600">
                      {locale === 'en'
                        ? 'Supports formatting like bold, links, lists, etc. Used by most email clients.'
                        : '太字、リンク、リストなどの装飾が可能。ほとんどのメールクライアントで表示されます。'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">{locale === 'en' ? 'Text Body' : '本文（テキスト）'}</h4>
                    <p className="text-sm text-gray-600">
                      {locale === 'en'
                        ? 'Plain text fallback for email clients that cannot display HTML.'
                        : 'HTMLを表示できないメールクライアント用のプレーンテキスト版。'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Conditional */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '5. Conditional Display' : '5. 条件分岐'}
                </h3>
                <p className="text-gray-600 mb-3">
                  {locale === 'en'
                    ? 'You can show or hide content based on whether a variable has a value.'
                    : '変数の有無によって、表示する内容を切り替えることができます。'}
                </p>
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2">{locale === 'en' ? 'Show only if variable exists:' : '変数がある場合のみ表示:'}</h4>
                    <code className="block bg-white border p-2 rounded text-xs">
                      {'{{#if staffName}}担当: {{staffName}}{{/if}}'}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">{locale === 'en' ? 'Show different content based on variable:' : '変数の有無で内容を切り替え:'}</h4>
                    <code className="block bg-white border p-2 rounded text-xs whitespace-pre-wrap">
                      {'{{#if staffName}}担当: {{staffName}}{{else}}担当: 指名なし{{/if}}'}
                    </code>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-2">{locale === 'en' ? 'Show only if variable is empty:' : '変数がない場合のみ表示:'}</h4>
                    <code className="block bg-white border p-2 rounded text-xs">
                      {'{{#unless staffName}}※スタッフは当日決定します{{/unless}}'}
                    </code>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                    <p className="text-sm text-yellow-800">
                      {locale === 'en'
                        ? 'Example: If customer selects a staff, show their name. If not, show "Not specified".'
                        : '例：お客様がスタッフを指名した場合は名前を表示、指名なしの場合は「指名なし」と表示'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Tips */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '6. Tips' : '6. 作成のコツ'}
                </h3>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>{locale === 'en' ? 'Keep subject lines short and clear' : '件名は短く分かりやすく'}</li>
                  <li>{locale === 'en' ? 'Include all important reservation details' : '予約内容の重要な情報を含める'}</li>
                  <li>{locale === 'en' ? 'Always include the cancel URL in confirmation emails' : '予約完了メールには必ずキャンセルURLを入れる'}</li>
                  <li>{locale === 'en' ? 'Create templates for both Japanese and English if needed' : '必要に応じて日本語・英語両方のテンプレートを作成'}</li>
                  <li>{locale === 'en' ? 'Use conditional display for staff name (may be empty)' : 'スタッフ名は条件分岐を使う（指名なしの場合があるため）'}</li>
                  <li>{locale === 'en' ? 'Test by making a test reservation' : 'テスト予約を入れて動作確認する'}</li>
                </ul>
              </section>

              {/* Sample */}
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">
                  {locale === 'en' ? '7. Sample Template' : '7. サンプルテンプレート'}
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2">{locale === 'en' ? 'Reservation Complete (Japanese)' : '予約完了（日本語）'}</h4>
                  <div className="bg-white border rounded p-3 text-sm">
                    <p className="font-medium mb-2">{locale === 'en' ? 'Subject:' : '件名:'}</p>
                    <code className="block bg-gray-100 p-2 rounded mb-3">【{'{{storeName}}'}】ご予約ありがとうございます</code>
                    <p className="font-medium mb-2">{locale === 'en' ? 'Body:' : '本文:'}</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs whitespace-pre-wrap">{`{{customerName}} 様

この度は{{storeName}}をご予約いただき、
誠にありがとうございます。

【ご予約内容】
店舗: {{storeName}}
メニュー: {{menuName}}
{{#if staffName}}担当: {{staffName}}{{else}}担当: 指名なし{{/if}}
日時: {{dateTime}}

ご予約のキャンセル・変更は下記URLより可能です。
{{cancelUrl}}

ご来店を心よりお待ちしております。`}</pre>
                  </div>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => setIsGuideOpen(false)}>
                {locale === 'en' ? 'Close' : '閉じる'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">
              {isNewTemplate
                ? (locale === 'en' ? 'Add New Template' : '新規テンプレート')
                : (locale === 'en' ? 'Edit Template' : 'テンプレートを編集')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isNewTemplate && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'en' ? 'Type' : 'タイプ'}
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-lg"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      >
                        {Object.entries(templateTypes).map(([key, value]) => (
                          <option key={key} value={key}>{value[locale]}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {locale === 'en' ? 'Language' : '言語'}
                      </label>
                      <select
                        className="w-full px-4 py-2 border rounded-lg"
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                      >
                        <option value="ja">日本語</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                  {sampleTemplates[formData.type as keyof typeof sampleTemplates] && (
                    <Button type="button" variant="outline" size="sm" onClick={applySampleTemplate}>
                      {locale === 'en' ? 'Apply Sample Template' : 'サンプルを適用'}
                    </Button>
                  )}
                </>
              )}

              {/* Variables Reference */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm font-medium text-blue-700 mb-2">
                  {locale === 'en' ? 'Available Variables (click to copy):' : '利用可能な変数（クリックでコピー）:'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {availableVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => copyVariable(v.key)}
                      className="text-xs bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                      title={v[locale]}
                    >
                      {copiedVar === v.key ? <Check className="w-3 h-3 inline mr-1" /> : null}
                      {v.key}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                label={locale === 'en' ? 'Subject' : '件名'}
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'en' ? 'Body' : '本文'}
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  {locale === 'en'
                    ? 'Enter plain text. HTML formatting will be generated automatically.'
                    : '普通のテキストで入力してください。HTML形式は自動で生成されます。'}
                </p>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg text-sm"
                  rows={12}
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                  placeholder={locale === 'en'
                    ? 'Example:\nDear {{customerName}},\n\nThank you for your reservation.\n\nReservation Details:\nStore: {{storeName}}\nMenu: {{menuName}}'
                    : '例：\n{{customerName}} 様\n\nご予約ありがとうございます。\n\n【ご予約内容】\n店舗: {{storeName}}\nメニュー: {{menuName}}'}
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm">
                  {locale === 'en' ? 'Active' : '有効'}
                </label>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setIsModalOpen(false); setEditingTemplate(null); setIsNewTemplate(false) }}
                >
                  {locale === 'en' ? 'Cancel' : 'キャンセル'}
                </Button>
                <Button type="submit">
                  {locale === 'en' ? 'Save' : '保存'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
