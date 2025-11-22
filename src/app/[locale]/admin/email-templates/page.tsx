'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Edit2, Mail } from 'lucide-react'
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
  '{{customerName}}', '{{storeName}}', '{{menuName}}', '{{staffName}}',
  '{{dateTime}}', '{{cancelUrl}}', '{{reservationId}}'
]

export default function EmailTemplatesPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [formData, setFormData] = useState({ subject: '', bodyHtml: '', bodyText: '' })

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
    if (!editingTemplate) return
    await fetch(`/api/admin/email-templates/${editingTemplate.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setIsModalOpen(false)
    setEditingTemplate(null)
    fetchTemplates()
  }

  const handleEdit = (t: EmailTemplate) => {
    setEditingTemplate(t)
    setFormData({ subject: t.subject, bodyHtml: t.bodyHtml, bodyText: t.bodyText })
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{locale === 'en' ? 'Email Templates' : 'メールテンプレート'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {locale === 'en' ? 'Available variables: ' : '利用可能な変数: '}
          {availableVariables.join(', ')}
        </p>
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
              <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                <Edit2 className="w-4 h-4" />
              </Button>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold mb-4">
              {locale === 'en' ? 'Edit Template' : 'テンプレートを編集'} - {templateTypes[editingTemplate.type as keyof typeof templateTypes]?.[locale]} ({editingTemplate.language.toUpperCase()})
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={locale === 'en' ? 'Subject' : '件名'} value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} required />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'en' ? 'Body (HTML)' : '本文（HTML）'}</label>
                <textarea className="w-full px-4 py-2 border rounded-lg font-mono text-sm" rows={10} value={formData.bodyHtml} onChange={(e) => setFormData({ ...formData, bodyHtml: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'en' ? 'Body (Text)' : '本文（テキスト）'}</label>
                <textarea className="w-full px-4 py-2 border rounded-lg font-mono text-sm" rows={6} value={formData.bodyText} onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })} />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTemplate(null) }}>{locale === 'en' ? 'Cancel' : 'キャンセル'}</Button>
                <Button type="submit">{locale === 'en' ? 'Save' : '保存'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
