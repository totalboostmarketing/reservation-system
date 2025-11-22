import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const storeId = searchParams.get('storeId')

    const targetDate = parseISO(date)
    const dayStart = startOfDay(targetDate)
    const dayEnd = endOfDay(targetDate)

    const where: any = {
      startTime: {
        gte: dayStart,
        lte: dayEnd,
      },
    }

    if (storeId) {
      where.storeId = storeId
    }

    // Get all reservations for the day
    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        store: true,
      },
    })

    // Calculate summary
    const summary = {
      total: reservations.length,
      reserved: reservations.filter((r) => r.status === 'reserved').length,
      visited: reservations.filter((r) => r.status === 'visited').length,
      cancelled: reservations.filter((r) => r.status === 'cancelled').length,
      noshow: reservations.filter((r) => r.status === 'noshow').length,
    }

    // Group by store
    const stores = await prisma.store.findMany({
      where: { isActive: true },
    })

    const byStore = stores.map((store) => {
      const storeReservations = reservations.filter((r) => r.storeId === store.id)
      return {
        storeId: store.id,
        storeName: store.nameJa,
        storeNameEn: store.nameEn,
        total: storeReservations.length,
        reserved: storeReservations.filter((r) => r.status === 'reserved').length,
        visited: storeReservations.filter((r) => r.status === 'visited').length,
        cancelled: storeReservations.filter((r) => r.status === 'cancelled').length,
        noshow: storeReservations.filter((r) => r.status === 'noshow').length,
      }
    })

    return NextResponse.json({
      date,
      summary,
      byStore,
    })
  } catch (error) {
    console.error('Failed to fetch summary:', error)
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 })
  }
}
