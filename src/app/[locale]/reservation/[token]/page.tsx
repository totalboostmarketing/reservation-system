'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import { formatDateTime, formatPrice, canCancel } from '@/lib/utils'
import { Check, X, AlertCircle, MapPin, Phone } from 'lucide-react'
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
  cancelToken: string
  store: { nameJa: string; nameEn: string; address: string; phone: string }
  menu: { nameJa: string; nameEn: string; duration: number }
  staff?: { nameJa: string; nameEn: string }
}

const statusLabels = {
  ja: {
    reserved: '予約済み',
    visited: '来店済み',
    cancelled: 'キャンセル済み',
    noshow: 'ノーショー',
  },
  en: {
    reserved: 'Reserved',
    visited: 'Visited',
    cancelled: 'Cancelled',
    noshow: 'No Show',
  },
}

export default function ReservationPage() {
  const params = useParams()
  const locale = (params.locale as Locale) || 'ja'
  const token = params.token as string

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const messages = locale === 'en'
    ? require('@/i18n/messages/en.json')
    : require('@/i18n/messages/ja.json')

  useEffect(() => {
    fetch(`/api/reservations?token=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then(setReservation)
      .catch(() => setError(messages.reservation.notFound))
      .finally(() => setIsLoading(false))
  }, [token])

  const handleCancel = async () => {
    if (!reservation) return
    if (!confirm(messages.reservation.cancelConfirm)) return

    setIsCancelling(true)
    try {
      const res = await fetch(`/api/reservations/${reservation.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      const updated = await res.json()
      setReservation({ ...reservation, status: updated.status })
      alert(messages.reservation.cancelSuccess)
    } catch (error) {
      alert(messages.reservation.cancelFailed)
    } finally {
      setIsCancelling(false)
    }
  }

  const canCancelReservation = reservation &&
    reservation.status === 'reserved' &&
    canCancel(reservation.startTime)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{messages.common.loading}</p>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">{error || messages.reservation.notFound}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-lg font-semibold">{messages.reservation.title}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Status */}
        <Card className="text-center py-6">
          {reservation.status === 'reserved' && (
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-blue-600" />
            </div>
          )}
          {reservation.status === 'visited' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          )}
          {reservation.status === 'cancelled' && (
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <X className="w-8 h-8 text-gray-600" />
            </div>
          )}
          <p className="text-lg font-semibold">
            {statusLabels[locale][reservation.status as keyof typeof statusLabels.ja]}
          </p>
        </Card>

        {/* Details */}
        <Card>
          <h2 className="font-semibold mb-4">{messages.booking.reservationDetails}</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-600">{messages.booking.reservationNumber}</dt>
              <dd className="font-mono font-bold">{reservation.id.slice(-8).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{messages.booking.dateTime}</dt>
              <dd className="font-medium">{formatDateTime(reservation.startTime, locale)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{messages.booking.menu}</dt>
              <dd className="font-medium">
                {locale === 'en' ? reservation.menu.nameEn : reservation.menu.nameJa}
                <span className="text-gray-500 text-sm ml-1">
                  ({reservation.menu.duration}{messages.common.minutes})
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">{messages.booking.staff}</dt>
              <dd className="font-medium">
                {reservation.staff
                  ? locale === 'en'
                    ? reservation.staff.nameEn
                    : reservation.staff.nameJa
                  : messages.booking.noPreference}
              </dd>
            </div>
            <div className="border-t pt-3 flex justify-between">
              <dt className="text-gray-600">{messages.booking.total}</dt>
              <dd className="text-xl font-bold text-teal-600">
                {formatPrice(reservation.finalPrice, locale)}
              </dd>
            </div>
          </dl>
        </Card>

        {/* Store Info */}
        <Card>
          <h2 className="font-semibold mb-4">{messages.booking.store}</h2>
          <p className="font-medium mb-2">
            {locale === 'en' ? reservation.store.nameEn : reservation.store.nameJa}
          </p>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{reservation.store.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{reservation.store.phone}</span>
            </div>
          </div>
        </Card>

        {/* Cancel Button */}
        {reservation.status === 'reserved' && (
          <div className="pt-4">
            {canCancelReservation ? (
              <Button
                variant="danger"
                onClick={handleCancel}
                isLoading={isCancelling}
                className="w-full"
              >
                {messages.reservation.cancelReservation}
              </Button>
            ) : (
              <div className="text-center text-sm text-gray-500 bg-gray-100 p-4 rounded-lg">
                {messages.reservation.cannotCancel}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
