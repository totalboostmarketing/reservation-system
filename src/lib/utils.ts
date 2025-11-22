import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, addMinutes, isBefore, parseISO } from 'date-fns'
import { ja, enUS } from 'date-fns/locale'
import type { Locale } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, locale: Locale = 'ja'): string {
  if (locale === 'en') {
    return `¥${price.toLocaleString()}`
  }
  return `${price.toLocaleString()}円`
}

export function formatDateTime(date: Date | string, locale: Locale = 'ja'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const dateLocale = locale === 'en' ? enUS : ja
  return format(d, locale === 'en' ? 'MMM d, yyyy h:mm a' : 'yyyy年M月d日 HH:mm', { locale: dateLocale })
}

export function formatDate(date: Date | string, locale: Locale = 'ja'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const dateLocale = locale === 'en' ? enUS : ja
  return format(d, locale === 'en' ? 'MMM d, yyyy' : 'yyyy年M月d日', { locale: dateLocale })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'HH:mm')
}

export function calculateEndTime(startTime: Date, durationMinutes: number, bufferAfter: number = 0): Date {
  return addMinutes(startTime, durationMinutes + bufferAfter)
}

export function canCancel(startTime: Date | string): boolean {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime
  const deadline = addMinutes(start, -24 * 60) // 24 hours before
  return isBefore(new Date(), deadline)
}

export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)

  let currentHour = openHour
  let currentMin = openMin

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMin < closeMin)
  ) {
    slots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    )
    currentMin += intervalMinutes
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}

export function calculateDiscount(
  originalPrice: number,
  discountType: 'percent' | 'fixed',
  discountValue: number
): number {
  if (discountType === 'percent') {
    return Math.floor(originalPrice * (discountValue / 100))
  }
  return Math.min(discountValue, originalPrice)
}
