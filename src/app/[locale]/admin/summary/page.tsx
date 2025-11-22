'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import { Button, Card, Input } from '@/components/ui'
import { Calendar, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import type { Locale } from '@/types'

interface Summary {
  total: number
  reserved: number
  visited: number
  cancelled: number
  noshow: number
}

interface StoreSummary extends Summary {
  storeId: string
  storeName: string
  storeNameEn: string
}

export default function SummaryPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ja'

  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [summary, setSummary] = useState<Summary | null>(null)
  const [byStore, setByStore] = useState<StoreSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchSummary = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/summary?date=${date}`)
      const data = await res.json()
      setSummary(data.summary)
      setByStore(data.byStore)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [date])

  const stats = [
    {
      label: locale === 'en' ? 'Total Reservations' : '総予約数',
      value: summary?.total || 0,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: locale === 'en' ? 'Visited' : '来店済み',
      value: summary?.visited || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: locale === 'en' ? 'Cancelled' : 'キャンセル',
      value: summary?.cancelled || 0,
      icon: XCircle,
      color: 'bg-gray-500',
    },
    {
      label: locale === 'en' ? 'No Show' : 'ノーショー',
      value: summary?.noshow || 0,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Daily Summary' : '日次サマリー'}
        </h1>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-auto"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-lg`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">{stat.label}</p>
              <p className="text-2xl font-bold">{isLoading ? '-' : stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Store Breakdown */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">
          {locale === 'en' ? 'By Store' : '店舗別'}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Store' : '店舗'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Total' : '合計'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Reserved' : '予約済み'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Visited' : '来店済み'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'Cancelled' : 'キャンセル'}
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">
                  {locale === 'en' ? 'No Show' : 'ノーショー'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {locale === 'en' ? 'Loading...' : '読み込み中...'}
                  </td>
                </tr>
              ) : byStore.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    {locale === 'en' ? 'No data' : 'データなし'}
                  </td>
                </tr>
              ) : (
                byStore.map((store) => (
                  <tr key={store.storeId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {locale === 'en' ? store.storeNameEn : store.storeName}
                    </td>
                    <td className="px-4 py-3 text-center">{store.total}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {store.reserved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {store.visited}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {store.cancelled}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                        {store.noshow}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
