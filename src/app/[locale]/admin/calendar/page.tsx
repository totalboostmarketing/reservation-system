'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { Button, Card } from '@/components/ui'
import { ChevronLeft, ChevronRight, X, Clock, User, Phone, Mail, Scissors } from 'lucide-react'
import type { Locale } from '@/types'

interface Reservation {
  id: string
  startTime: string
  endTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
  status: string
  finalPrice: number
  menu: { nameJa: string; nameEn: string; duration: number }
  staff?: { id: string; nameJa: string; nameEn: string }
  store: { nameJa: string; nameEn: string }
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

const statusColors: Record<string, string> = {
  reserved: 'bg-blue-500',
  visited: 'bg-green-500',
  cancelled: 'bg-gray-400',
  noshow: 'bg-red-500',
}

const statusLabels = {
  reserved: { ja: '予約済み', en: 'Reserved' },
  visited: { ja: '来店済み', en: 'Visited' },
  cancelled: { ja: 'キャンセル', en: 'Cancelled' },
  noshow: { ja: 'ノーショー', en: 'No Show' },
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
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const hours = Array.from({ length: 14 }, (_, i) => i + 9) // 9:00 - 22:00

  const fetchReservations = useCallback(() => {
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
    fetchReservations()
  }, [fetchReservations])

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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, reservation: Reservation) => {
    setDraggedReservation(reservation)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, staffId: string, date: Date, hour: number) => {
    e.preventDefault()
    if (!draggedReservation || isUpdating) return

    // Don't update if dropped on same slot
    const originalStart = new Date(draggedReservation.startTime)
    const newStartDate = new Date(date)
    newStartDate.setHours(hour, 0, 0, 0)

    if (
      originalStart.getTime() === newStartDate.getTime() &&
      draggedReservation.staff?.id === staffId
    ) {
      setDraggedReservation(null)
      return
    }

    setIsUpdating(true)

    try {
      const duration = draggedReservation.menu.duration
      const newEndDate = new Date(newStartDate)
      newEndDate.setMinutes(newEndDate.getMinutes() + duration)

      const res = await fetch(`/api/admin/reservations/${draggedReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStartDate.toISOString(),
          endTime: newEndDate.toISOString(),
          staffId: staffId,
        }),
      })

      if (res.ok) {
        fetchReservations()
      } else {
        alert(locale === 'en' ? 'Failed to update reservation' : '予約の更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update reservation:', error)
      alert(locale === 'en' ? 'Failed to update reservation' : '予約の更新に失敗しました')
    } finally {
      setDraggedReservation(null)
      setIsUpdating(false)
    }
  }

  const handleStatusChange = async (reservationId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (res.ok) {
        fetchReservations()
        setSelectedReservation(null)
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr)
    return format(date, locale === 'en' ? 'MMM d, yyyy h:mm a' : 'yyyy年M月d日 H:mm', { locale: dateLocale })
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

      {/* Drag hint */}
      <p className="text-sm text-gray-500 mb-2">
        {locale === 'en'
          ? '💡 Drag and drop reservations to change time/staff. Click to view details.'
          : '💡 予約をドラッグ＆ドロップで時間・スタッフを変更できます。クリックで詳細表示。'}
      </p>

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
                        className={`p-1 min-h-[60px] border-r last:border-r-0 relative ${
                          draggedReservation ? 'bg-blue-50' : ''
                        }`}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, s.id, day, hour)}
                      >
                        {slotReservations.map((r) => (
                          <div
                            key={r.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, r)}
                            onClick={() => setSelectedReservation(r)}
                            className={`${statusColors[r.status] || 'bg-blue-500'} text-white text-xs p-1 rounded mb-1 truncate cursor-pointer hover:opacity-80 transition-opacity`}
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

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {locale === 'en' ? 'Reservation Details' : '予約詳細'}
              </h2>
              <button
                onClick={() => setSelectedReservation(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${statusColors[selectedReservation.status]}`}>
                  {statusLabels[selectedReservation.status as keyof typeof statusLabels]?.[locale] || selectedReservation.status}
                </span>
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{selectedReservation.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a href={`mailto:${selectedReservation.customerEmail}`} className="text-blue-600 hover:underline">
                    {selectedReservation.customerEmail}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a href={`tel:${selectedReservation.customerPhone}`} className="text-blue-600 hover:underline">
                    {selectedReservation.customerPhone}
                  </a>
                </div>
              </div>

              {/* Reservation Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{formatDateTime(selectedReservation.startTime)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Scissors className="w-5 h-5 text-gray-400" />
                  <span>
                    {locale === 'en' ? selectedReservation.menu.nameEn : selectedReservation.menu.nameJa}
                    <span className="text-gray-500 ml-2">({selectedReservation.menu.duration}{locale === 'en' ? 'min' : '分'})</span>
                  </span>
                </div>
                {selectedReservation.staff && (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{locale === 'en' ? selectedReservation.staff.nameEn : selectedReservation.staff.nameJa}</span>
                  </div>
                )}
                <div className="text-lg font-bold mt-2">
                  ¥{selectedReservation.finalPrice.toLocaleString()}
                </div>
              </div>

              {/* Status Change Buttons */}
              {selectedReservation.status === 'reserved' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => handleStatusChange(selectedReservation.id, 'visited')}
                    className="flex-1 bg-green-500 hover:bg-green-600"
                  >
                    {locale === 'en' ? 'Mark as Visited' : '来店済みにする'}
                  </Button>
                  <Button
                    onClick={() => handleStatusChange(selectedReservation.id, 'noshow')}
                    variant="outline"
                    className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
                  >
                    {locale === 'en' ? 'No Show' : 'ノーショー'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
