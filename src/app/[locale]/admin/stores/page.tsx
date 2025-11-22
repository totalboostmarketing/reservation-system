'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, MapPin, Phone, Mail } from 'lucide-react'
import type { Locale } from '@/types'

interface Store {
  id: string
  nameJa: string
  nameEn: string
  address: string
  phone: string
  email: string
  bedCount: number
  isActive: boolean
  businessHours: { dayOfWeek: number; openTime: string; closeTime: string; isOpen: boolean }[]
  _count: { staff: number; reservations: number }
}

const dayNames = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
}

export default function StoresPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ja'

  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStore, setEditingStore] = useState<Store | null>(null)
  const [formData, setFormData] = useState({
    nameJa: '',
    nameEn: '',
    address: '',
    phone: '',
    email: '',
    bedCount: 1,
  })

  const fetchStores = async () => {
    try {
      const res = await fetch('/api/admin/stores')
      const data = await res.json()
      setStores(data)
    } catch (error) {
      console.error('Failed to fetch stores:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStore ? `/api/admin/stores/${editingStore.id}` : '/api/admin/stores'
      const method = editingStore ? 'PATCH' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      setIsModalOpen(false)
      setEditingStore(null)
      setFormData({ nameJa: '', nameEn: '', address: '', phone: '', email: '', bedCount: 1 })
      fetchStores()
    } catch (error) {
      console.error('Failed to save store:', error)
    }
  }

  const handleEdit = (store: Store) => {
    setEditingStore(store)
    setFormData({
      nameJa: store.nameJa,
      nameEn: store.nameEn,
      address: store.address,
      phone: store.phone,
      email: store.email,
      bedCount: store.bedCount,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure?' : '本当に削除しますか？')) return

    try {
      await fetch(`/api/admin/stores/${id}`, { method: 'DELETE' })
      fetchStores()
    } catch (error) {
      console.error('Failed to delete store:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Store Management' : '店舗管理'}
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'en' ? 'Add Store' : '店舗を追加'}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'Loading...' : '読み込み中...'}
          </Card>
        ) : stores.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'No stores' : '店舗がありません'}
          </Card>
        ) : (
          stores.map((store) => (
            <Card key={store.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {locale === 'en' ? store.nameEn : store.nameJa}
                  </h3>
                  {!store.isActive && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                      {locale === 'en' ? 'Inactive' : '非公開'}
                    </span>
                  )}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{store.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{store.email}</span>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {locale === 'en' ? 'Staff' : 'スタッフ'}: {store._count.staff} |{' '}
                  {locale === 'en' ? 'Beds' : 'ベッド数'}: {store.bedCount}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(store)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(store.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingStore
                ? locale === 'en'
                  ? 'Edit Store'
                  : '店舗を編集'
                : locale === 'en'
                ? 'Add Store'
                : '店舗を追加'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={locale === 'en' ? 'Name (Japanese)' : '店舗名（日本語）'}
                value={formData.nameJa}
                onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Name (English)' : '店舗名（英語）'}
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Address' : '住所'}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Phone' : '電話番号'}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Email' : 'メールアドレス'}
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Number of Beds' : 'ベッド数'}
                type="number"
                min="1"
                value={formData.bedCount}
                onChange={(e) => setFormData({ ...formData, bedCount: parseInt(e.target.value) })}
              />
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingStore(null)
                    setFormData({ nameJa: '', nameEn: '', address: '', phone: '', email: '', bedCount: 1 })
                  }}
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
