'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Button, Input, Card } from '@/components/ui'
import { Search, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/types'

interface Reservation {
  id: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  channel: string
  status: string
  finalPrice: number
  store: { nameJa: string; nameEn: string }
  menu: { nameJa: string; nameEn: string }
  staff?: { nameJa: string; nameEn: string }
  coupon?: { code: string }
  campaign?: { nameJa: string }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusLabels = {
  ja: {
    reserved: '予約済み',
    visited: '来店済み',
    cancelled: 'キャンセル',
    noshow: 'ノーショー',
  },
  en: {
    reserved: 'Reserved',
    visited: 'Visited',
    cancelled: 'Cancelled',
    noshow: 'No Show',
  },
}

const statusColors = {
  reserved: 'bg-blue-100 text-blue-800',
  visited: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
  noshow: 'bg-red-100 text-red-800',
}

export default function ReservationsPage() {
  const params = useParams()
  const rawLocale = params.locale as string
  const locale: Locale = (rawLocale === 'en' ? 'en' : 'ja')

  const [reservations, setReservations] = useState<Reservation[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchReservations = async (page = 1) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({ page: page.toString(), limit: '20' })
      if (search) params.set('search', search)
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/reservations?${params}`)
      const data = await res.json()
      setReservations(data.reservations)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const handleSearch = () => {
    fetchReservations(1)
  }

  const handleExport = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    window.open(`/api/admin/reservations/export?${params}`, '_blank')
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Reservations' : '予約一覧'}
        </h1>
        <Button onClick={handleExport} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder={locale === 'en' ? 'Search by name/email/phone' : '名前/メール/電話で検索'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <span className="self-center">〜</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="">{locale === 'en' ? 'All Status' : '全てのステータス'}</option>
            <option value="reserved">{statusLabels[locale].reserved}</option>
            <option value="visited">{statusLabels[locale].visited}</option>
            <option value="cancelled">{statusLabels[locale].cancelled}</option>
            <option value="noshow">{statusLabels[locale].noshow}</option>
          </select>
          <Button onClick={handleSearch}>
            <Search className="w-4 h-4 mr-2" />
            {locale === 'en' ? 'Search' : '検索'}
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Date/Time' : '日時'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Store' : '店舗'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Menu' : 'メニュー'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Staff' : '担当者'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Customer' : '顧客'}
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Status' : 'ステータス'}
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Price' : '料金'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {locale === 'en' ? 'Loading...' : '読み込み中...'}
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    {locale === 'en' ? 'No reservations found' : '予約が見つかりません'}
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 font-mono text-sm">
                      {r.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{format(new Date(r.startTime), 'yyyy/MM/dd')}</div>
                      <div className="text-gray-500">
                        {format(new Date(r.startTime), 'HH:mm')} - {format(new Date(r.endTime), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {locale === 'en' ? r.store.nameEn : r.store.nameJa}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {locale === 'en' ? r.menu.nameEn : r.menu.nameJa}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {r.staff
                        ? locale === 'en'
                          ? r.staff.nameEn
                          : r.staff.nameJa
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{r.customerName}</div>
                      <div className="text-gray-500 text-xs">{r.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[r.status as keyof typeof statusColors]
                        }`}
                      >
                        {statusLabels[locale][r.status as keyof typeof statusLabels.ja]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      ¥{r.finalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600">
              {locale === 'en'
                ? `${pagination.total} total reservations`
                : `全${pagination.total}件`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReservations(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-3 py-1 text-sm">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchReservations(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
