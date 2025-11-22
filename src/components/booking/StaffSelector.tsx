'use client'

import { Card } from '@/components/ui'
import { User } from 'lucide-react'
import type { Locale } from '@/types'

interface Staff {
  id: string
  nameJa: string
  nameEn: string
}

interface StaffSelectorProps {
  staff: Staff[]
  selectedId?: string
  onSelect: (id: string | undefined) => void
  locale: Locale
  messages: {
    noPreference: string
  }
}

export function StaffSelector({ staff, selectedId, onSelect, locale, messages }: StaffSelectorProps) {
  return (
    <div className="space-y-3">
      <Card
        selected={selectedId === undefined}
        onClick={() => onSelect(undefined)}
        className="cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-5 h-5 text-gray-500" />
          </div>
          <span className="font-medium">{messages.noPreference}</span>
        </div>
      </Card>
      {staff.map((s) => (
        <Card
          key={s.id}
          selected={selectedId === s.id}
          onClick={() => onSelect(s.id)}
          className="cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="w-5 h-5 text-teal-600" />
            </div>
            <span className="font-medium">
              {locale === 'en' ? s.nameEn : s.nameJa}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
