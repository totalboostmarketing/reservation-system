'use client'

import { Card } from '@/components/ui'
import { MapPin, Phone, Clock } from 'lucide-react'
import type { Locale } from '@/types'

interface Store {
  id: string
  nameJa: string
  nameEn: string
  address: string
  phone: string
}

interface StoreSelectorProps {
  stores: Store[]
  selectedId?: string
  onSelect: (id: string) => void
  locale: Locale
}

export function StoreSelector({ stores, selectedId, onSelect, locale }: StoreSelectorProps) {
  return (
    <div className="space-y-3">
      {stores.map((store) => (
        <Card
          key={store.id}
          selected={selectedId === store.id}
          onClick={() => onSelect(store.id)}
          className="cursor-pointer"
        >
          <h3 className="font-semibold text-lg mb-2">
            {locale === 'en' ? store.nameEn : store.nameJa}
          </h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{store.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{store.phone}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
