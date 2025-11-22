'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import type { Locale } from '@/types'

interface Campaign {
  id: string
  nameJa: string
  nameEn: string
  descriptionJa?: string
  descriptionEn?: string
  discountType: string
  discountValue: number
  startDate: string
  endDate: string
  isActive: boolean
  campaignStores: { store: { id: string; nameJa: string; nameEn: string } }[]
  campaignMenus: { menu: { id: string; nameJa: string; nameEn: string } }[]
  _count: { reservations: number }
}

export default function CampaignsPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stores, setStores] = useState<{ id: string; nameJa: string; nameEn: string }[]>([])
  const [menus, setMenus] = useState<{ id: string; nameJa: string; nameEn: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [formData, setFormData] = useState({
    nameJa: '', nameEn: '', descriptionJa: '', descriptionEn: '',
    discountType: 'percent', discountValue: 10,
    startDate: '', endDate: '', storeIds: [] as string[], menuIds: [] as string[],
  })

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns')
      setCampaigns(await res.json())
    } catch (error) {
      console.error('Failed to fetch campaigns:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
    fetch('/api/stores').then((r) => r.json()).then(setStores)
    fetch('/api/admin/menus').then((r) => r.json()).then(setMenus)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingCampaign ? `/api/admin/campaigns/${editingCampaign.id}` : '/api/admin/campaigns'
    await fetch(url, { method: editingCampaign ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
    setIsModalOpen(false)
    setEditingCampaign(null)
    resetForm()
    fetchCampaigns()
  }

  const resetForm = () => setFormData({ nameJa: '', nameEn: '', descriptionJa: '', descriptionEn: '', discountType: 'percent', discountValue: 10, startDate: '', endDate: '', storeIds: [], menuIds: [] })

  const handleEdit = (c: Campaign) => {
    setEditingCampaign(c)
    setFormData({
      nameJa: c.nameJa, nameEn: c.nameEn, descriptionJa: c.descriptionJa || '', descriptionEn: c.descriptionEn || '',
      discountType: c.discountType, discountValue: c.discountValue,
      startDate: format(new Date(c.startDate), 'yyyy-MM-dd'), endDate: format(new Date(c.endDate), 'yyyy-MM-dd'),
      storeIds: c.campaignStores.map((s) => s.store.id), menuIds: c.campaignMenus.map((m) => m.menu.id),
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure?' : '本当に削除しますか？')) return
    await fetch(`/api/admin/campaigns/${id}`, { method: 'DELETE' })
    fetchCampaigns()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{locale === 'en' ? 'Campaigns' : 'キャンペーン管理'}</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />{locale === 'en' ? 'Add Campaign' : 'キャンペーンを追加'}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'Loading...' : '読み込み中...'}</Card>
        ) : campaigns.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'No campaigns' : 'キャンペーンがありません'}</Card>
        ) : (
          campaigns.map((c) => (
            <Card key={c.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold">{locale === 'en' ? c.nameEn : c.nameJa}</h3>
                  {!c.isActive && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">{locale === 'en' ? 'Inactive' : '非公開'}</span>}
                </div>
                <p className="text-sm text-gray-600 mb-2">{locale === 'en' ? c.descriptionEn : c.descriptionJa}</p>
                <p className="text-lg font-bold text-teal-600">
                  {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `¥${c.discountValue} OFF`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(c.startDate), 'yyyy/MM/dd')} - {format(new Date(c.endDate), 'yyyy/MM/dd')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(c)}><Edit2 className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg my-8">
            <h2 className="text-xl font-bold mb-4">{editingCampaign ? (locale === 'en' ? 'Edit Campaign' : 'キャンペーンを編集') : (locale === 'en' ? 'Add Campaign' : 'キャンペーンを追加')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={locale === 'en' ? 'Name (Japanese)' : '名前（日本語）'} value={formData.nameJa} onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })} required />
              <Input label={locale === 'en' ? 'Name (English)' : '名前（英語）'} value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} required />
              <Input label={locale === 'en' ? 'Description (Japanese)' : '説明（日本語）'} value={formData.descriptionJa} onChange={(e) => setFormData({ ...formData, descriptionJa: e.target.value })} />
              <Input label={locale === 'en' ? 'Description (English)' : '説明（英語）'} value={formData.descriptionEn} onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{locale === 'en' ? 'Discount Type' : '割引タイプ'}</label>
                  <select className="w-full px-4 py-2 border rounded-lg" value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}>
                    <option value="percent">{locale === 'en' ? 'Percentage' : '割合（%）'}</option>
                    <option value="fixed">{locale === 'en' ? 'Fixed Amount' : '固定額（円）'}</option>
                  </select>
                </div>
                <Input label={locale === 'en' ? 'Discount Value' : '割引値'} type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={locale === 'en' ? 'Start Date' : '開始日'} type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                <Input label={locale === 'en' ? 'End Date' : '終了日'} type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingCampaign(null); resetForm() }}>{locale === 'en' ? 'Cancel' : 'キャンセル'}</Button>
                <Button type="submit">{locale === 'en' ? 'Save' : '保存'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
