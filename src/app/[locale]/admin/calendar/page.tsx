'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format, addDays, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { Button, Card } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Locale } from '@/types'

interface Reservation {
  id: string
  startTime: string
  endTime: string
  customerName: string
  status: string
  menu: { nameJa: string; nameEn: string }
  staff?: { id: string; nameJa: string; nameEn: string }
}

interface Staff {
  id: string
  nameJa: string
  nameEn: string
}

interface Store {
  id: string
  nameJa: string
  nameEn: string
}

const statusColors = {
  reserved: 'bg-blue-500',
  visited: 'bg-green-500',
  cancelled: 'bg-gray-400',
  noshow: 'bg-red-500',
}

export default function CalendarPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ja'
  const dateLocale = locale === 'en' ? enUS : ja

  const [viewMode, setViewMode] = useState<'day' | 'week'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [staff, setStaff] = useState<Staff[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])

  const hours = Array.from({ length: 14 }, (_, i) => i + 9) // 9:00 - 22:00

  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then((data) => {
        setStores(data)
        if (data.length > 0) setSelectedStoreId(data[0].id)
      })
  }, [])

  useEffect(() => {
    if (selectedStoreId) {
      fetch(`/api/stores/${selectedStoreId}/staff`)
        .then((res) => res.json())
        .then(setStaff)
    }
  }, [selectedStoreId])

  useEffect(() => {
    if (selectedStoreId) {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const dateFrom = format(viewMode === 'day' ? currentDate : weekStart, 'yyyy-MM-dd')
      const dateTo = format(
        viewMode === 'day' ? currentDate : addDays(weekStart, 6),
        'yyyy-MM-dd'
      )

      fetch(
        `/api/admin/reservations?storeId=${selectedStoreId}&dateFrom=${dateFrom}&dateTo=${dateTo}&limit=500`
      )
        .then((res) => res.json())
        .then((data) => setReservations(data.reservations || []))
    }
  }, [selectedStoreId, currentDate, viewMode])

  const handlePrev = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, -1))
    } else {
      setCurrentDate(subWeeks(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else {
      setCurrentDate(addWeeks(currentDate, 1))
    }
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = viewMode === 'day' ? [currentDate] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getReservationsForStaffAndTime = (staffId: string, date: Date, hour: number) => {
    return reservations.filter((r) => {
      const start = new Date(r.startTime)
      const isSameDay = format(start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      const startsAtHour = start.getHours() === hour
      const isStaffMatch = r.staff?.id === staffId
      return isSameDay && startsAtHour && isStaffMatch
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {locale === 'en' ? 'Calendar' : 'カレンダー'}
        </h1>
        <div className="flex gap-2">
          <select
            value={selectedStoreId}
            onChange={(e) => setSelectedStoreId(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {locale === 'en' ? store.nameEn : store.nameJa}
              </option>
            ))}
          </select>
          <Button
            variant={viewMode === 'day' ? 'primary' : 'outline'}
            onClick={() => setViewMode('day')}
          >
            {locale === 'en' ? 'Day' : '日'}
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'outline'}
            onClick={() => setViewMode('week')}
          >
            {locale === 'en' ? 'Week' : '週'}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={handlePrev}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="font-medium">
          {viewMode === 'day'
            ? format(currentDate, locale === 'en' ? 'MMMM d, yyyy' : 'yyyy年M月d日', { locale: dateLocale })
            : `${format(weekStart, locale === 'en' ? 'MMM d' : 'M/d', { locale: dateLocale })} - ${format(addDays(weekStart, 6), locale === 'en' ? 'MMM d, yyyy' : 'M/d', { locale: dateLocale })}`}
        </span>
        <Button variant="outline" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header */}
          <div className="grid border-b" style={{ gridTemplateColumns: `80px repeat(${staff.length}, 1fr)` }}>
            <div className="p-2 border-r bg-gray-50"></div>
            {staff.map((s) => (
              <div key={s.id} className="p-2 text-center font-medium bg-gray-50 border-r last:border-r-0">
                {locale === 'en' ? s.nameEn : s.nameJa}
              </div>
            ))}
          </div>

          {/* Body */}
          {days.map((day) => (
            <div key={day.toISOString()}>
              {viewMode === 'week' && (
                <div className="bg-gray-100 px-2 py-1 text-sm font-medium border-b">
                  {format(day, locale === 'en' ? 'EEE, MMM d' : 'M/d (E)', { locale: dateLocale })}
                </div>
              )}
              {hours.map((hour) => (
                <div
                  key={`${day.toISOString()}-${hour}`}
                  className="grid border-b"
                  style={{ gridTemplateColumns: `80px repeat(${staff.length}, 1fr)` }}
                >
                  <div className="p-2 text-sm text-gray-500 border-r bg-gray-50">
                    {hour}:00
                  </div>
                  {staff.map((s) => {
                    const slotReservations = getReservationsForStaffAndTime(s.id, day, hour)
                    return (
                      <div
                        key={s.id}
                        className="p-1 min-h-[60px] border-r last:border-r-0 relative"
                      >
                        {slotReservations.map((r) => (
                          <div
                            key={r.id}
                            className={`${statusColors[r.status as keyof typeof statusColors]} text-white text-xs p-1 rounded mb-1 truncate`}
                            title={`${r.customerName} - ${locale === 'en' ? r.menu.nameEn : r.menu.nameJa}`}
                          >
                            {r.customerName}
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-sm">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>{locale === 'en' ? 'Reserved' : '予約済み'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>{locale === 'en' ? 'Visited' : '来店済み'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-gray-400"></div>
          <span>{locale === 'en' ? 'Cancelled' : 'キャンセル'}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span>{locale === 'en' ? 'No Show' : 'ノーショー'}</span>
        </div>
      </div>
    </div>
  )
}
