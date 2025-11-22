export type Locale = 'ja' | 'en'

export type ReservationStatus = 'reserved' | 'visited' | 'cancelled' | 'noshow'
export type ReservationChannel = 'web' | 'phone'
export type DiscountType = 'percent' | 'fixed'

export interface Store {
  id: string
  nameJa: string
  nameEn: string
  address: string
  phone: string
  email: string
  mapUrl?: string
  bedCount: number
  isActive: boolean
}

export interface Menu {
  id: string
  nameJa: string
  nameEn: string
  descriptionJa?: string
  descriptionEn?: string
  duration: number
  bufferBefore: number
  bufferAfter: number
  price: number
  taxRate: number
  isActive: boolean
}

export interface Staff {
  id: string
  storeId: string
  nameJa: string
  nameEn: string
  isActive: boolean
}

export interface TimeSlot {
  time: string
  available: boolean
  staffIds: string[]
}

export interface ReservationFormData {
  storeId: string
  menuId: string
  staffId?: string
  date: string
  time: string
  customerName: string
  customerEmail: string
  customerPhone: string
  couponCode?: string
  agreedToTerms: boolean
  language: Locale
}

export interface Reservation {
  id: string
  storeId: string
  menuId: string
  staffId?: string
  startTime: Date
  endTime: Date
  customerName: string
  customerEmail: string
  customerPhone: string
  language: Locale
  channel: ReservationChannel
  status: ReservationStatus
  originalPrice: number
  discountAmount: number
  finalPrice: number
  couponId?: string
  campaignId?: string
  adminNote?: string
  cancelToken: string
}
