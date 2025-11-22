'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Button, Card, Input } from '@/components/ui'
import { Plus, Edit2, Trash2, Ticket } from 'lucide-react'
import type { Locale } from '@/types'

interface Coupon {
  id: string
  code: string
  nameJa: string
  nameEn: string
  discountType: string
  discountValue: number
  startDate: string
  endDate: string
  minPurchaseAmount?: number
  maxUsageTotal?: number
  maxUsagePerUser?: number
  usageCount: number
  isActive: boolean
  _count: { reservations: number }
}

export default function CouponsPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = rawLocale === 'en' ? 'en' : 'ja'

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState({
    code: '', nameJa: '', nameEn: '', discountType: 'fixed', discountValue: 500,
    startDate: '', endDate: '', minPurchaseAmount: '', maxUsageTotal: '', maxUsagePerUser: '',
  })

  const fetchCoupons = async () => {
    try {
      const res = await fetch('/api/admin/coupons')
      setCoupons(await res.json())
    } catch (error) {
      console.error('Failed to fetch coupons:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingCoupon ? `/api/admin/coupons/${editingCoupon.id}` : '/api/admin/coupons'
    const data = {
      ...formData,
      minPurchaseAmount: formData.minPurchaseAmount ? parseInt(formData.minPurchaseAmount) : null,
      maxUsageTotal: formData.maxUsageTotal ? parseInt(formData.maxUsageTotal) : null,
      maxUsagePerUser: formData.maxUsagePerUser ? parseInt(formData.maxUsagePerUser) : null,
    }
    await fetch(url, { method: editingCoupon ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    setIsModalOpen(false)
    setEditingCoupon(null)
    resetForm()
    fetchCoupons()
  }

  const resetForm = () => setFormData({ code: '', nameJa: '', nameEn: '', discountType: 'fixed', discountValue: 500, startDate: '', endDate: '', minPurchaseAmount: '', maxUsageTotal: '', maxUsagePerUser: '' })

  const handleEdit = (c: Coupon) => {
    setEditingCoupon(c)
    setFormData({
      code: c.code, nameJa: c.nameJa, nameEn: c.nameEn, discountType: c.discountType, discountValue: c.discountValue,
      startDate: format(new Date(c.startDate), 'yyyy-MM-dd'), endDate: format(new Date(c.endDate), 'yyyy-MM-dd'),
      minPurchaseAmount: c.minPurchaseAmount?.toString() || '', maxUsageTotal: c.maxUsageTotal?.toString() || '', maxUsagePerUser: c.maxUsagePerUser?.toString() || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'en' ? 'Are you sure?' : '本当に削除しますか？')) return
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    fetchCoupons()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{locale === 'en' ? 'Coupons' : 'クーポン管理'}</h1>
        <Button onClick={() => { resetForm(); setIsModalOpen(true) }}>
          <Plus className="w-4 h-4 mr-2" />{locale === 'en' ? 'Add Coupon' : 'クーポンを追加'}
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'Loading...' : '読み込み中...'}</Card>
        ) : coupons.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">{locale === 'en' ? 'No coupons' : 'クーポンがありません'}</Card>
        ) : (
          coupons.map((c) => (
            <Card key={c.id} className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Ticket className="w-5 h-5 text-orange-500" />
                  <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{c.code}</code>
                  {!c.isActive && <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded">{locale === 'en' ? 'Inactive' : '非公開'}</span>}
                </div>
                <h3 className="font-semibold">{locale === 'en' ? c.nameEn : c.nameJa}</h3>
                <p className="text-lg font-bold text-orange-600 mt-1">
                  {c.discountType === 'percent' ? `${c.discountValue}% OFF` : `¥${c.discountValue} OFF`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(c.startDate), 'yyyy/MM/dd')} - {format(new Date(c.endDate), 'yyyy/MM/dd')}
                  {c.maxUsageTotal && ` | ${locale === 'en' ? 'Used' : '利用'}: ${c.usageCount}/${c.maxUsageTotal}`}
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
            <h2 className="text-xl font-bold mb-4">{editingCoupon ? (locale === 'en' ? 'Edit Coupon' : 'クーポンを編集') : (locale === 'en' ? 'Add Coupon' : 'クーポンを追加')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input label={locale === 'en' ? 'Code' : 'クーポンコード'} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="WELCOME500" />
              <Input label={locale === 'en' ? 'Name (Japanese)' : '名前（日本語）'} value={formData.nameJa} onChange={(e) => setFormData({ ...formData, nameJa: e.target.value })} required />
              <Input label={locale === 'en' ? 'Name (English)' : '名前（英語）'} value={formData.nameEn} onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })} required />
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
              <Input label={locale === 'en' ? 'Min Purchase Amount' : '最低利用金額'} type="number" value={formData.minPurchaseAmount} onChange={(e) => setFormData({ ...formData, minPurchaseAmount: e.target.value })} placeholder={locale === 'en' ? 'Optional' : '任意'} />
              <div className="grid grid-cols-2 gap-4">
                <Input label={locale === 'en' ? 'Max Total Usage' : '全体利用上限'} type="number" value={formData.maxUsageTotal} onChange={(e) => setFormData({ ...formData, maxUsageTotal: e.target.value })} placeholder={locale === 'en' ? 'Optional' : '任意'} />
                <Input label={locale === 'en' ? 'Max Per User' : '1人あたり上限'} type="number" value={formData.maxUsagePerUser} onChange={(e) => setFormData({ ...formData, maxUsagePerUser: e.target.value })} placeholder={locale === 'en' ? 'Optional' : '任意'} />
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingCoupon(null); resetForm() }}>{locale === 'en' ? 'Cancel' : 'キャンセル'}</Button>
                <Button type="submit">{locale === 'en' ? 'Save' : '保存'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
