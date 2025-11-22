'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfDay, isSameDay } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import type { Locale } from '@/types'

interface TimeSlot {
  time: string
  available: boolean
}

interface DateTimeSelectorProps {
  selectedDate?: string
  selectedTime?: string
  onSelect: (date: string, time: string) => void
  availableSlots: TimeSlot[]
  onDateChange: (date: string) => void
  locale: Locale
  messages: {
    noAvailableSlots: string
    selectAnotherDate: string
  }
}

export function DateTimeSelector({
  selectedDate,
  selectedTime,
  onSelect,
  availableSlots,
  onDateChange,
  locale,
  messages,
}: DateTimeSelectorProps) {
  const [weekStart, setWeekStart] = useState(() => startOfDay(new Date()))
  const dateLocale = locale === 'en' ? enUS : ja

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const handlePrevWeek = () => {
    const newStart = addDays(weekStart, -7)
    if (newStart >= startOfDay(new Date())) {
      setWeekStart(newStart)
    }
  }

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    onDateChange(dateStr)
  }

  const canGoPrev = addDays(weekStart, -7) >= startOfDay(new Date())

  return (
    <div className="space-y-4">
      {/* Date selector */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevWeek}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <span className="font-medium">
          {format(weekStart, locale === 'en' ? 'MMM yyyy' : 'yyyy年M月', { locale: dateLocale })}
        </span>
        <Button variant="ghost" size="sm" onClick={handleNextWeek}>
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isSelected = selectedDate === dateStr
          const isPast = day < startOfDay(new Date())

          return (
            <button
              key={dateStr}
              onClick={() => !isPast && handleDateClick(day)}
              disabled={isPast}
              className={`p-2 rounded-lg text-center transition-colors ${
                isSelected
                  ? 'bg-teal-600 text-white'
                  : isPast
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'hover:bg-teal-50'
              }`}
            >
              <div className="text-xs">
                {format(day, locale === 'en' ? 'EEE' : 'E', { locale: dateLocale })}
              </div>
              <div className="text-lg font-semibold">{format(day, 'd')}</div>
            </button>
          )
        })}
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="mt-6">
          {availableSlots.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {availableSlots.map((slot) => (
                <button
                  key={slot.time}
                  onClick={() => slot.available && onSelect(selectedDate, slot.time)}
                  disabled={!slot.available}
                  className={`py-2 px-3 rounded-lg text-center transition-colors ${
                    selectedTime === slot.time
                      ? 'bg-teal-600 text-white'
                      : slot.available
                      ? 'bg-gray-100 hover:bg-teal-50'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>{messages.noAvailableSlots}</p>
              <p className="text-sm">{messages.selectAnotherDate}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
