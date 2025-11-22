'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { format, addDays, startOfWeek, addWeeks, subWeeks, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { Button, Card } from '@/components/ui'
import { ChevronLeft, ChevronRight, X, Clock, User, Phone, Mail, Scissors, Calendar } from 'lucide-react'
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

  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState<string>('')
  const [staff, setStaff] = useState<Staff[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [draggedReservation, setDraggedReservation] = useState<Reservation | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showMiniCalendar, setShowMiniCalendar] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStaffId, setEditStaffId] = useState('')

  // 15分刻みのタイムスロット (9:00 - 22:00)
  const timeSlots = Array.from({ length: 52 }, (_, i) => {
    const hour = Math.floor(i / 4) + 9
    const minute = (i % 4) * 15
    return { hour, minute, label: `${hour}:${minute.toString().padStart(2, '0')}` }
  })

  const fetchReservations = useCallback(() => {
    if (selectedStoreId) {
      let dateFrom: string, dateTo: string

      if (viewMode === 'month') {
        const monthStart = startOfMonth(currentDate)
        const monthEnd = endOfMonth(currentDate)
        dateFrom = format(monthStart, 'yyyy-MM-dd')
        dateTo = format(monthEnd, 'yyyy-MM-dd')
      } else {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        dateFrom = format(viewMode === 'day' ? currentDate : weekStart, 'yyyy-MM-dd')
        dateTo = format(viewMode === 'day' ? currentDate : addDays(weekStart, 6), 'yyyy-MM-dd')
      }

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
    } else if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1))
    } else {
      setCurrentDate(subMonths(currentDate, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'day') {
      setCurrentDate(addDays(currentDate, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1))
    } else {
      setCurrentDate(addMonths(currentDate, 1))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
  const days = viewMode === 'day' ? [currentDate] : Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Mini calendar dates
  const miniCalendarStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 })
  const miniCalendarEnd = addDays(miniCalendarStart, 41)
  const miniCalendarDays = eachDayOfInterval({ start: miniCalendarStart, end: miniCalendarEnd })

  const getReservationsForStaffAndTime = (staffId: string, date: Date, hour: number, minute: number) => {
    return reservations.filter((r) => {
      const start = new Date(r.startTime)
      const isSameDay = format(start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      const startsAtSlot = start.getHours() === hour && start.getMinutes() >= minute && start.getMinutes() < minute + 15
      const isStaffMatch = r.staff?.id === staffId
      return isSameDay && startsAtSlot && isStaffMatch
    })
  }

  const getReservationsForDay = (date: Date) => {
    return reservations.filter((r) => {
      const start = new Date(r.startTime)
      return format(start, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    })
  }

  const handleDragStart = (e: React.DragEvent, reservation: Reservation) => {
    setDraggedReservation(reservation)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, staffId: string, date: Date, hour: number, minute: number) => {
    e.preventDefault()
    if (!draggedReservation || isUpdating) return

    const originalStart = new Date(draggedReservation.startTime)
    const newStartDate = new Date(date)
    newStartDate.setHours(hour, minute, 0, 0)

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

  const startEditing = () => {
    if (!selectedReservation) return
    const startDate = parseISO(selectedReservation.startTime)
    setEditDate(format(startDate, 'yyyy-MM-dd'))
    setEditTime(format(startDate, 'HH:mm'))
    setEditStaffId(selectedReservation.staff?.id || '')
    setIsEditing(true)
  }

  const cancelEditing = () => {
    setIsEditing(false)
  }

  const saveChanges = async () => {
    if (!selectedReservation || isUpdating) return

    setIsUpdating(true)
    try {
      const [hours, minutes] = editTime.split(':').map(Number)
      const newStartDate = parseISO(editDate)
      newStartDate.setHours(hours, minutes, 0, 0)

      const duration = selectedReservation.menu.duration
      const newEndDate = new Date(newStartDate)
      newEndDate.setMinutes(newEndDate.getMinutes() + duration)

      const res = await fetch(`/api/admin/reservations/${selectedReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: newStartDate.toISOString(),
          endTime: newEndDate.toISOString(),
          staffId: editStaffId || null,
        }),
      })

      if (res.ok) {
        fetchReservations()
        setSelectedReservation(null)
        setIsEditing(false)
      } else {
        alert(locale === 'en' ? 'Failed to update reservation' : '予約の更新に失敗しました')
      }
    } catch (error) {
      console.error('Failed to update reservation:', error)
      alert(locale === 'en' ? 'Failed to update reservation' : '予約の更新に失敗しました')
    } finally {
      setIsUpdating(false)
    }
  }

  // 15分刻みの時間オプションを生成
  const timeOptions = Array.from({ length: 52 }, (_, i) => {
    const hour = Math.floor(i / 4) + 9
    const minute = (i % 4) * 15
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
  })

  const formatDateTime = (dateStr: string) => {
    const date = parseISO(dateStr)
    return format(date, locale === 'en' ? 'MMM d, yyyy h:mm a' : 'yyyy年M月d日 H:mm', { locale: dateLocale })
  }

  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr)
    return format(date, 'H:mm')
  }

  return (
    <div className="flex h-[calc(100vh-120px)]">
      {/* Left Sidebar - Mini Calendar */}
      {showMiniCalendar && (
        <div className="w-64 border-r pr-4 flex-shrink-0">
          {/* Mini Calendar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-sm">
                {format(currentDate, locale === 'en' ? 'MMMM yyyy' : 'yyyy年M月', { locale: dateLocale })}
              </span>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {['月', '火', '水', '木', '金', '土', '日'].map((d) => (
                <div key={d} className="text-center text-gray-500 py-1">{d}</div>
              ))}
              {miniCalendarDays.map((day) => {
                const dayReservations = getReservationsForDay(day)
                const hasReservations = dayReservations.length > 0
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setCurrentDate(day)
                      setViewMode('day')
                    }}
                    className={`
                      p-1 text-center rounded-full text-sm relative
                      ${!isSameMonth(day, currentDate) ? 'text-gray-300' : ''}
                      ${isToday(day) ? 'bg-blue-500 text-white' : ''}
                      ${isSameDay(day, currentDate) && !isToday(day) ? 'bg-blue-100' : ''}
                      ${!isToday(day) && !isSameDay(day, currentDate) ? 'hover:bg-gray-100' : ''}
                    `}
                  >
                    {format(day, 'd')}
                    {hasReservations && !isToday(day) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"></span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Store & Staff Filter */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {locale === 'en' ? 'Store' : '店舗'}
              </label>
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {locale === 'en' ? store.nameEn : store.nameJa}
                  </option>
                ))}
              </select>
            </div>

            {/* Legend */}
            <div className="pt-4 border-t">
              <p className="text-xs font-medium text-gray-500 mb-2">{locale === 'en' ? 'Status' : 'ステータス'}</p>
              <div className="space-y-1">
                {Object.entries(statusLabels).map(([key, label]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-3 h-3 rounded ${statusColors[key]}`}></div>
                    <span>{label[locale]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col min-w-0 pl-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMiniCalendar(!showMiniCalendar)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Calendar className="w-5 h-5" />
            </button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {locale === 'en' ? 'Today' : '今日'}
            </Button>
            <button onClick={handlePrev} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={handleNext} className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-medium ml-2">
              {viewMode === 'day' && format(currentDate, locale === 'en' ? 'MMMM d, yyyy' : 'yyyy年M月d日', { locale: dateLocale })}
              {viewMode === 'week' && `${format(weekStart, locale === 'en' ? 'MMM d' : 'M月d日', { locale: dateLocale })} - ${format(addDays(weekStart, 6), locale === 'en' ? 'MMM d, yyyy' : 'd日', { locale: dateLocale })}`}
              {viewMode === 'month' && format(currentDate, locale === 'en' ? 'MMMM yyyy' : 'yyyy年M月', { locale: dateLocale })}
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'day' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              {locale === 'en' ? 'Day' : '日'}
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'week' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              {locale === 'en' ? 'Week' : '週'}
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-sm rounded ${viewMode === 'month' ? 'bg-white shadow' : 'hover:bg-gray-200'}`}
            >
              {locale === 'en' ? 'Month' : '月'}
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto border rounded-lg">
          {viewMode === 'month' ? (
            /* Month View */
            <div className="h-full">
              <div className="grid grid-cols-7 border-b">
                {['月', '火', '水', '木', '金', '土', '日'].map((d, i) => (
                  <div key={d} className={`p-2 text-center text-sm font-medium border-r last:border-r-0 ${i >= 5 ? 'text-gray-400' : ''}`}>
                    {locale === 'en' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] : d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 grid-rows-6 h-[calc(100%-40px)]">
                {miniCalendarDays.slice(0, 42).map((day) => {
                  const dayReservations = getReservationsForDay(day)
                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => {
                        setCurrentDate(day)
                        setViewMode('day')
                      }}
                      className={`border-r border-b p-1 cursor-pointer hover:bg-gray-50 ${!isSameMonth(day, currentDate) ? 'bg-gray-50' : ''}`}
                    >
                      <div className={`text-sm mb-1 ${isToday(day) ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''} ${!isSameMonth(day, currentDate) ? 'text-gray-400' : ''}`}>
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-1">
                        {dayReservations.slice(0, 3).map((r) => (
                          <div
                            key={r.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedReservation(r)
                            }}
                            className={`${statusColors[r.status]} text-white text-xs px-1 py-0.5 rounded truncate`}
                          >
                            {formatTime(r.startTime)} {r.customerName}
                          </div>
                        ))}
                        {dayReservations.length > 3 && (
                          <div className="text-xs text-gray-500">+{dayReservations.length - 3}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Day/Week View */
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid border-b sticky top-0 bg-white z-10" style={{ gridTemplateColumns: `60px repeat(${staff.length * days.length}, 1fr)` }}>
                <div className="p-2 border-r bg-gray-50"></div>
                {days.map((day) => (
                  staff.map((s, sIdx) => (
                    <div
                      key={`${day.toISOString()}-${s.id}`}
                      className={`p-2 text-center border-r last:border-r-0 ${sIdx === 0 ? 'border-l-2 border-l-gray-300' : ''}`}
                    >
                      {sIdx === 0 && (
                        <div className={`text-xs ${isToday(day) ? 'text-blue-500' : 'text-gray-500'}`}>
                          {format(day, locale === 'en' ? 'EEE' : 'E', { locale: dateLocale })}
                        </div>
                      )}
                      {sIdx === 0 && (
                        <div className={`text-lg ${isToday(day) ? 'bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center mx-auto' : ''}`}>
                          {format(day, 'd')}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 mt-1">
                        {locale === 'en' ? s.nameEn : s.nameJa}
                      </div>
                    </div>
                  ))
                ))}
              </div>

              {/* Time slots - 15分刻み */}
              {timeSlots.map((slot, slotIdx) => (
                <div
                  key={slot.label}
                  className={`grid ${slot.minute === 0 ? 'border-t border-gray-300' : 'border-t border-gray-100'}`}
                  style={{ gridTemplateColumns: `60px repeat(${staff.length * days.length}, 1fr)` }}
                >
                  <div className={`text-xs text-gray-500 border-r bg-gray-50 text-right pr-2 ${slot.minute === 0 ? 'py-1' : 'py-0.5'}`}>
                    {slot.minute === 0 ? slot.label : ''}
                  </div>
                  {days.map((day) => (
                    staff.map((s, sIdx) => {
                      const slotReservations = getReservationsForStaffAndTime(s.id, day, slot.hour, slot.minute)
                      return (
                        <div
                          key={`${day.toISOString()}-${s.id}-${slot.label}`}
                          className={`min-h-[20px] border-r last:border-r-0 relative ${sIdx === 0 ? 'border-l-2 border-l-gray-200' : ''} ${draggedReservation ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, s.id, day, slot.hour, slot.minute)}
                        >
                          {slotReservations.map((r) => (
                            <div
                              key={r.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, r)}
                              onClick={() => setSelectedReservation(r)}
                              className={`${statusColors[r.status]} text-white text-xs p-1 rounded cursor-pointer hover:opacity-90 shadow-sm absolute inset-x-0.5 z-10`}
                              style={{ minHeight: `${Math.max(20, Math.ceil(r.menu.duration / 15) * 20)}px` }}
                            >
                              <div className="font-medium truncate">{r.customerName}</div>
                              <div className="opacity-80 truncate text-[10px]">{locale === 'en' ? r.menu.nameEn : r.menu.nameJa}</div>
                            </div>
                          ))}
                        </div>
                      )
                    })
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSelectedReservation(null); setIsEditing(false); }}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {isEditing
                  ? (locale === 'en' ? 'Edit Reservation' : '予約編集')
                  : (locale === 'en' ? 'Reservation Details' : '予約詳細')}
              </h2>
              <button
                onClick={() => { setSelectedReservation(null); setIsEditing(false); }}
                className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-white text-sm ${statusColors[selectedReservation.status]}`}>
                  {statusLabels[selectedReservation.status as keyof typeof statusLabels]?.[locale] || selectedReservation.status}
                </span>
              </div>

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

              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-4 border rounded-lg p-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'en' ? 'Date' : '日付'}
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'en' ? 'Time' : '時間'}
                    </label>
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'en' ? 'Staff' : '担当スタッフ'}
                    </label>
                    <select
                      value={editStaffId}
                      onChange={(e) => setEditStaffId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">{locale === 'en' ? 'Not specified' : '指名なし'}</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {locale === 'en' ? s.nameEn : s.nameJa}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={saveChanges}
                      isLoading={isUpdating}
                      className="flex-1"
                    >
                      {locale === 'en' ? 'Save' : '保存'}
                    </Button>
                    <Button
                      onClick={cancelEditing}
                      variant="outline"
                      className="flex-1"
                    >
                      {locale === 'en' ? 'Cancel' : 'キャンセル'}
                    </Button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
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

                  {selectedReservation.status === 'reserved' && (
                    <>
                      <div className="pt-4 border-t">
                        <Button
                          onClick={startEditing}
                          variant="outline"
                          className="w-full mb-3"
                        >
                          {locale === 'en' ? 'Edit Date/Time/Staff' : '日時・スタッフを変更'}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleStatusChange(selectedReservation.id, 'visited')}
                          className="flex-1 bg-green-500 hover:bg-green-600"
                        >
                          {locale === 'en' ? 'Visited' : '来店済み'}
                        </Button>
                        <Button
                          onClick={() => handleStatusChange(selectedReservation.id, 'noshow')}
                          variant="outline"
                          className="flex-1 text-red-500 border-red-500 hover:bg-red-50"
                        >
                          {locale === 'en' ? 'No Show' : 'ノーショー'}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
