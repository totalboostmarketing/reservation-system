'use client'

import { Card } from '@/components/ui'
import { Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import type { Locale } from '@/types'

interface Menu {
  id: string
  nameJa: string
  nameEn: string
  descriptionJa?: string | null
  descriptionEn?: string | null
  duration: number
  price: number
  taxRate: number
}

interface MenuSelectorProps {
  menus: Menu[]
  selectedId?: string
  onSelect: (id: string) => void
  locale: Locale
  messages: {
    minutes: string
    taxIncluded: string
  }
}

export function MenuSelector({ menus, selectedId, onSelect, locale, messages }: MenuSelectorProps) {
  return (
    <div className="space-y-3">
      {menus.map((menu) => {
        const priceWithTax = Math.floor(menu.price * (1 + menu.taxRate))
        return (
          <Card
            key={menu.id}
            selected={selectedId === menu.id}
            onClick={() => onSelect(menu.id)}
            className="cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">
                  {locale === 'en' ? menu.nameEn : menu.nameJa}
                </h3>
                {(locale === 'en' ? menu.descriptionEn : menu.descriptionJa) && (
                  <p className="text-sm text-gray-600 mt-1">
                    {locale === 'en' ? menu.descriptionEn : menu.descriptionJa}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{menu.duration}{messages.minutes}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-semibold text-teal-600">
                  {formatPrice(priceWithTax, locale)}
                </span>
                <span className="text-xs text-gray-500 block">{messages.taxIncluded}</span>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
