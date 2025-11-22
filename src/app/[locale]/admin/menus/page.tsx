'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Locale } from '@/types'

interface Menu {
  id: string
  nameJa: string
  nameEn: string
  descriptionJa?: string
  descriptionEn?: string
  duration: number
  bufferBefore: number
  bufferAfter: number
  price: number
  taxRate: number
  displayOrder: number
  isActive: boolean
  storeMenus: { store: { id: string; nameJa: string; nameEn: string } }[]
}

interface Store {
  id: string
  nameJa: string
  nameEn: string
}

export default function MenusPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ja'

  const [menus, setMenus] = useState<Menu[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  const [formData, setFormData] = useState({
    nameJa: '',
    nameEn: '',
    descriptionJa: '',
    descriptionEn: '',
    duration: 60,
    bufferBefore: 0,
    bufferAfter: 10,
    price: 5000,
    taxRate: 0.1,
    storeIds: [] as string[],
  })

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus')
      const data = await res.json()
      setMenus(data)
    } catch (error) {
      console.error('Failed to fetch menus:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMenus()
    fetch('/api/stores').then((res) => res.json()).then(setStores)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingMenu ? `/api/admin/menus/${editingMenu.id}` : '/api/admin/menus'
      const method = editingMenu ? 'PATCH' : 'POST'

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      setIsModalOpen(false)
      setEditingMenu(null)
      resetForm()
      fetchMenus()
    } catch (error) {
      console.error('Failed to save menu:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      nameJa: '',
      nameEn: '',
      descriptionJa: '',
      descriptionEn: '',
      duration: 60,
      bufferBefore: 0,
      bufferAfter: 10,
      price: 5000,
      taxRate: 0.1,
      storeIds: [],
    })
  }

  const handleEdit = (menu: Menu) => {
    setEditingMenu(menu)
    setFormData({
      nameJa: menu.nameJa,
      nameEn: menu.nameEn,
      descriptionJa: menu.descriptionJa || '',
      descriptionEn: menu.descriptionEn || '',
      duration: menu.duration,
      bufferBefore: menu.bufferBefore,
      bufferAfter: menu.bufferAfter,
      price: menu.price,
      taxRate: menu.taxRate,
      storeIds: menu.storeMenus.map((sm) => sm.store.id),
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure?' : '本当に削除しますか？')) return

    try {
      await fetch(`/api/admin/menus/${id}`, { method: 'DELETE' })
      fetchMenus()
    } catch (error) {
      console.error('Failed to delete menu:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Menu Management' : 'メニュー管理'}
        </h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {locale === 'en' ? 'Add Menu' : 'メニューを追加'}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'Loading...' : '読み込み中...'}
          </Card>
        ) : menus.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            {locale === 'en' ? 'No menus' : 'メニューがありません'}
          </Card>
        ) : (
          menus.map((menu) => (
            <Card key={menu.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">
                    {locale === 'en' ? menu.nameEn : menu.nameJa}
                  </h3>
                  {!menu.isActive && (
                    <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">
                      {locale === 'en' ? 'Inactive' : '非公開'}
                    </span>
                  )}
                </div>
                {(locale === 'en' ? menu.descriptionEn : menu.descriptionJa) && (
                  <p className="text-sm text-gray-600 mb-2">
                    {locale === 'en' ? menu.descriptionEn : menu.descriptionJa}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{menu.duration}{locale === 'en' ? 'min' : '分'}</span>
                  </div>
                  <span className="text-lg font-semibold text-teal-600">
                    {formatPrice(Math.floor(menu.price * (1 + menu.taxRate)), locale)}
                  </span>
                </div>
                {menu.storeMenus.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {menu.storeMenus.map((sm) => (
                      <span
                        key={sm.store.id}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {locale === 'en' ? sm.store.nameEn : sm.store.nameJa}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(menu)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(menu.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold mb-4">
              {editingMenu
                ? locale === 'en'
                  ? 'Edit Menu'
                  : 'メニューを編集'
                : locale === 'en'
                ? 'Add Menu'
                : 'メニューを追加'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={locale === 'en' ? 'Name (Japanese)' : 'メニュー名（日本語）'}
                value={formData.nameJa}
                onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })}
                required
              />
              <Input
                label={locale === 'en' ? 'Name (English)' : 'メニュー名（英語）'}
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'en' ? 'Description (Japanese)' : '説明（日本語）'}
                </label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  value={formData.descriptionJa}
                  onChange={(e) => setFormData({ ...formData, descriptionJa: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'en' ? 'Description (English)' : '説明（英語）'}
                </label>
                <textarea
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                  value={formData.descriptionEn}
                  onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label={locale === 'en' ? 'Duration (min)' : '所要時間（分）'}
                  type="number"
                  min="15"
                  step="15"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                  required
                />
                <Input
                  label={locale === 'en' ? 'Buffer Before' : '前バッファ'}
                  type="number"
                  min="0"
                  step="5"
                  value={formData.bufferBefore}
                  onChange={(e) => setFormData({ ...formData, bufferBefore: parseInt(e.target.value) })}
                />
                <Input
                  label={locale === 'en' ? 'Buffer After' : '後バッファ'}
                  type="number"
                  min="0"
                  step="5"
                  value={formData.bufferAfter}
                  onChange={(e) => setFormData({ ...formData, bufferAfter: parseInt(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={locale === 'en' ? 'Price' : '料金'}
                  type="number"
                  min="0"
                  step="100"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'en' ? 'Tax Rate' : '税率'}
                  </label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                  >
                    <option value={0.1}>10%</option>
                    <option value={0.08}>8%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'en' ? 'Available Stores' : '対応店舗'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {stores.map((store) => (
                    <label key={store.id} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={formData.storeIds.includes(store.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, storeIds: [...formData.storeIds, store.id] })
                          } else {
                            setFormData({
                              ...formData,
                              storeIds: formData.storeIds.filter((id) => id !== store.id),
                            })
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{locale === 'en' ? store.nameEn : store.nameJa}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingMenu(null)
                    resetForm()
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
