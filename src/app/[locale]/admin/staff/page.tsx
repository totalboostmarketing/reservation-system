'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, User } from 'lucide-react'
import type { Locale } from '@/types'

interface Staff {
  id: string
  storeId: string
  nameJa: string
  nameEn: string
  displayOrder: number
  isActive: boolean
  store: { nameJa: string; nameEn: string }
  _count: { reservations: number }
}

interface Store {
  id: string
  nameJa: string
  nameEn: string
}

export default function StaffPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [staffList, setStaffList] = useState<Staff[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState({
    storeId: '',
    nameJa: '',
    nameEn: '',
    displayOrder: 0,
  })

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/admin/staff')
      const data = await res.json()
      setStaffList(data)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
    fetch('/api/stores').then((res) => res.json()).then(setStores)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingStaff ? `/api/admin/staff/${editingStaff.id}` : '/api/admin/staff'
      const method = editingStaff ? 'PATCH' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      setIsModalOpen(false)
      setEditingStaff(null)
      resetForm()
      fetchStaff()
    } catch (error) {
      console.error('Failed to save staff:', error)
    }
  }

  const resetForm = () => {
    setFormData({ storeId: '', nameJa: '', nameEn: '', displayOrder: 0 })
  }

  const handleEdit = (staff: Staff) => {
    setEditingStaff(staff)
    setFormData({
      storeId: staff.storeId,
      nameJa: staff.nameJa,
      nameEn: staff.nameEn,
      displayOrder: staff.displayOrder,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure?' : '本当に削除しますか？')) return
    try {
      await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      fetchStaff()
    } catch (error) {
      console.error('Failed to delete staff:', error)
    }
  }

  const handleAdd = () => {
    resetForm()
    if (stores.length > 0) {
      setFormData((prev) => ({ ...prev, storeId: stores[0].id }))
    }
    setIsModalOpen(true)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Staff Management' : 'スタッフ管理'}
        </h1>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'en' ? 'Add Staff' : 'スタッフを追加'}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'Loading...' : '読み込み中...'}
          </Card>
        ) : staffList.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'No staff' : 'スタッフがいません'}
          </Card>
        ) : (
          staffList.map((staff) => (
            <Card key={staff.id} className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {locale === 'en' ? staff.nameEn : staff.nameJa}
                    </h3>
                    {!staff.isActive && (
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                        {locale === 'en' ? 'Inactive' : '非公開'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {locale === 'en' ? staff.store.nameEn : staff.store.nameJa}
                  </p>
                  <p className="text-xs text-gray-400">
                    {locale === 'en' ? 'Reservations' : '予約数'}: {staff._count.reservations}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(staff)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(staff.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingStaff
                ? locale === 'en' ? 'Edit Staff' : 'スタッフを編集'
                : locale === 'en' ? 'Add Staff' : 'スタッフを追加'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'en' ? 'Store' : '店舗'} *
                </label>
                <select
                  className="w-full px-4 py-2 border rounded-lg"
                  value={formData.storeId}
                  onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  required
                >
                  <option value="">{locale === 'en' ? 'Select store' : '店舗を選択'}</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {locale === 'en' ? store.nameEn : store.nameJa}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label={locale === 'en' ? 'Name (Japanese)' : '名前（日本語）'}
                value={formData.nameJa}
                onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Name (English)' : '名前（英語）'}
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Display Order' : '表示順'}
                type="number"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
              />
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingStaff(null); resetForm() }}>
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
