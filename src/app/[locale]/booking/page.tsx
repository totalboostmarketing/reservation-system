'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card } from '@/components/ui'
import {
  StoreSelector,
  MenuSelector,
  StaffSelector,
  DateTimeSelector,
  CustomerForm,
  type CustomerData,
} from '@/components/booking'
import { formatPrice, formatDateTime, formatDate } from '@/lib/utils'
import { Check, ChevronLeft } from 'lucide-react'
import type { Locale } from '@/types'

type Step = 'store' | 'menu' | 'staff' | 'datetime' | 'customer' | 'confirm' | 'complete'

interface Store {
  id: string
  nameJa: string
  nameEn: string
  address: string
  phone: string
}

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

interface Staff {
  id: string
  nameJa: string
  nameEn: string
}

interface TimeSlot {
  time: string
  available: boolean
}

interface ReservationResult {
  id: string
  cancelToken: string
  startTime: string
  store: Store
  menu: Menu
  staff?: Staff
  finalPrice: number
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const locale = (params.locale as Locale) || 'ja'

  const [step, setStep] = useState<Step>('store')
  const [stores, setStores] = useState<Store[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [reservation, setReservation] = useState<ReservationResult | null>(null)

  // Form state
  const [selectedStoreId, setSelectedStoreId] = useState<string>()
  const [selectedMenuId, setSelectedMenuId] = useState<string>()
  const [selectedStaffId, setSelectedStaffId] = useState<string>()
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [customerData, setCustomerData] = useState<CustomerData>()

  // Messages
  const messages = locale === 'en'
    ? require('@/i18n/messages/en.json')
    : require('@/i18n/messages/ja.json')

  // Fetch stores on mount
  useEffect(() => {
    fetch('/api/stores')
      .then((res) => res.json())
      .then(setStores)
      .catch(console.error)
  }, [])

  // Fetch menus when store is selected
  useEffect(() => {
    if (selectedStoreId) {
      fetch(`/api/stores/${selectedStoreId}/menus`)
        .then((res) => res.json())
        .then(setMenus)
        .catch(console.error)
    }
  }, [selectedStoreId])

  // Fetch staff when menu is selected
  useEffect(() => {
    if (selectedStoreId && selectedMenuId) {
      fetch(`/api/stores/${selectedStoreId}/staff?menuId=${selectedMenuId}`)
        .then((res) => res.json())
        .then(setStaff)
        .catch(console.error)
    }
  }, [selectedStoreId, selectedMenuId])

  // Fetch availability when date changes
  const fetchAvailability = async (date: string) => {
    if (!selectedStoreId || !selectedMenuId) return

    const params = new URLSearchParams({
      storeId: selectedStoreId,
      menuId: selectedMenuId,
      date,
    })
    if (selectedStaffId) {
      params.set('staffId', selectedStaffId)
    }

    try {
      const res = await fetch(`/api/availability?${params}`)
      const slots = await res.json()
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Failed to fetch availability:', error)
    }
  }

  const handleDateChange = (date: string) => {
    setSelectedDate(date)
    setSelectedTime(undefined)
    fetchAvailability(date)
  }

  const handleSubmit = async () => {
    if (!selectedStoreId || !selectedMenuId || !selectedDate || !selectedTime || !customerData) {
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId: selectedStoreId,
          menuId: selectedMenuId,
          staffId: selectedStaffId,
          date: selectedDate,
          time: selectedTime,
          customerName: customerData.customerName,
          customerEmail: customerData.customerEmail,
          customerPhone: customerData.customerPhone,
          couponCode: customerData.couponCode,
          language: locale,
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to create reservation')
      }

      const result = await res.json()
      setReservation(result)
      setStep('complete')
    } catch (error) {
      console.error('Failed to create reservation:', error)
      alert(messages.common.error)
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStore = stores.find((s) => s.id === selectedStoreId)
  const selectedMenu = menus.find((m) => m.id === selectedMenuId)
  const selectedStaffMember = staff.find((s) => s.id === selectedStaffId)

  const steps: { key: Step; label: string }[] = [
    { key: 'store', label: messages.booking.selectStore },
    { key: 'menu', label: messages.booking.selectMenu },
    { key: 'staff', label: messages.booking.selectStaff },
    { key: 'datetime', label: messages.booking.selectDate },
    { key: 'customer', label: messages.booking.customerInfo },
    { key: 'confirm', label: messages.booking.confirmReservation },
  ]

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  const canGoBack = step !== 'store' && step !== 'complete'

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setStep(steps[prevIndex].key)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center">
          {canGoBack && (
            <button onClick={handleBack} className="mr-3">
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{messages.booking.title}</h1>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => router.push(`/ja/booking`)}
              className={`px-2 py-1 text-sm rounded ${locale === 'ja' ? 'bg-teal-100 text-teal-700' : 'text-gray-500'}`}
            >
              日本語
            </button>
            <button
              onClick={() => router.push(`/en/booking`)}
              className={`px-2 py-1 text-sm rounded ${locale === 'en' ? 'bg-teal-100 text-teal-700' : 'text-gray-500'}`}
            >
              EN
            </button>
          </div>
        </div>
      </header>

      {/* Progress */}
      {step !== 'complete' && (
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex justify-between mb-2">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`flex-1 h-1 mx-0.5 rounded ${
                  i <= currentStepIndex ? 'bg-teal-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600">{steps[currentStepIndex]?.label}</p>
        </div>
      )}

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 pb-24">
        {step === 'store' && (
          <StoreSelector
            stores={stores}
            selectedId={selectedStoreId}
            onSelect={(id) => {
              setSelectedStoreId(id)
              setStep('menu')
            }}
            locale={locale}
          />
        )}

        {step === 'menu' && (
          <MenuSelector
            menus={menus}
            selectedId={selectedMenuId}
            onSelect={(id) => {
              setSelectedMenuId(id)
              setStep('staff')
            }}
            locale={locale}
            messages={{
              minutes: messages.common.minutes,
              taxIncluded: messages.common.taxIncluded,
            }}
          />
        )}

        {step === 'staff' && (
          <StaffSelector
            staff={staff}
            selectedId={selectedStaffId}
            onSelect={(id) => {
              setSelectedStaffId(id)
              setStep('datetime')
            }}
            locale={locale}
            messages={{ noPreference: messages.booking.noPreference }}
          />
        )}

        {step === 'datetime' && (
          <DateTimeSelector
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelect={(date, time) => {
              setSelectedDate(date)
              setSelectedTime(time)
              setStep('customer')
            }}
            availableSlots={availableSlots}
            onDateChange={handleDateChange}
            locale={locale}
            messages={{
              noAvailableSlots: messages.booking.noAvailableSlots,
              selectAnotherDate: messages.booking.selectAnotherDate,
            }}
          />
        )}

        {step === 'customer' && (
          <CustomerForm
            initialData={customerData}
            onSubmit={(data) => {
              setCustomerData(data)
              setStep('confirm')
            }}
            messages={{
              name: messages.booking.name,
              email: messages.booking.email,
              phone: messages.booking.phone,
              couponCode: messages.booking.couponCode,
              applyCoupon: messages.booking.applyCoupon,
              termsAgreement: messages.booking.termsAgreement,
              next: messages.common.next,
              required: messages.validation.required,
              invalidEmail: messages.validation.invalidEmail,
              invalidPhone: messages.validation.invalidPhone,
              mustAgreeToTerms: messages.validation.mustAgreeToTerms,
            }}
          />
        )}

        {step === 'confirm' && selectedStore && selectedMenu && customerData && (
          <div className="space-y-6">
            <Card>
              <h3 className="font-semibold mb-4">{messages.booking.reservationDetails}</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.store}</dt>
                  <dd className="font-medium">
                    {locale === 'en' ? selectedStore.nameEn : selectedStore.nameJa}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.menu}</dt>
                  <dd className="font-medium">
                    {locale === 'en' ? selectedMenu.nameEn : selectedMenu.nameJa}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.staff}</dt>
                  <dd className="font-medium">
                    {selectedStaffMember
                      ? locale === 'en'
                        ? selectedStaffMember.nameEn
                        : selectedStaffMember.nameJa
                      : messages.booking.noPreference}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.dateTime}</dt>
                  <dd className="font-medium">
                    {selectedDate && selectedTime && (
                      <>
                        {formatDate(selectedDate, locale)} {selectedTime}
                      </>
                    )}
                  </dd>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <dt className="text-gray-600">{messages.booking.total}</dt>
                  <dd className="text-xl font-bold text-teal-600">
                    {formatPrice(Math.floor(selectedMenu.price * (1 + selectedMenu.taxRate)), locale)}
                  </dd>
                </div>
              </dl>
            </Card>

            <Card>
              <h3 className="font-semibold mb-4">{messages.booking.customerInfo}</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.name}</dt>
                  <dd>{customerData.customerName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.email}</dt>
                  <dd>{customerData.customerEmail}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{messages.booking.phone}</dt>
                  <dd>{customerData.customerPhone}</dd>
                </div>
              </dl>
            </Card>

            <Button onClick={handleSubmit} isLoading={isLoading} className="w-full" size="lg">
              {messages.booking.completeReservation}
            </Button>
          </div>
        )}

        {step === 'complete' && reservation && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{messages.booking.reservationComplete}</h2>
            <p className="text-gray-600 mb-6">{messages.booking.confirmationEmailSent}</p>

            <Card className="text-left">
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm text-gray-600">{messages.booking.reservationNumber}</dt>
                  <dd className="font-mono font-bold">{reservation.id.slice(-8).toUpperCase()}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{messages.booking.dateTime}</dt>
                  <dd className="font-medium">{formatDateTime(reservation.startTime, locale)}</dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{messages.booking.store}</dt>
                  <dd className="font-medium">
                    {locale === 'en' ? reservation.store.nameEn : reservation.store.nameJa}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-gray-600">{messages.booking.total}</dt>
                  <dd className="text-xl font-bold text-teal-600">
                    {formatPrice(reservation.finalPrice, locale)}
                  </dd>
                </div>
              </dl>
            </Card>

            <p className="text-sm text-gray-500 mt-6">{messages.booking.cancelInfo}</p>
          </div>
        )}
      </main>
    </div>
  )
}
