import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO, format, addMinutes, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { generateTimeSlots } from '@/lib/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const menuId = searchParams.get('menuId')
    const staffId = searchParams.get('staffId')
    const date = searchParams.get('date')

    if (!storeId || !menuId || !date) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const targetDate = parseISO(date)
    const dayOfWeek = targetDate.getDay()

    // Get store and business hours
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      include: {
        businessHours: { where: { dayOfWeek } },
        holidays: {
          where: {
            date: {
              gte: startOfDay(targetDate),
              lte: endOfDay(targetDate),
            },
          },
        },
      },
    })

    if (!store || store.holidays.length > 0) {
      return NextResponse.json([])
    }

    const businessHour = store.businessHours[0]
    if (!businessHour || !businessHour.isOpen) {
      return NextResponse.json([])
    }

    // Get menu duration
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    const totalDuration = menu.duration + menu.bufferBefore + menu.bufferAfter

    // Get staff (either specific or all active staff in store)
    type StaffType = { id: string; storeId: string; nameJa: string; nameEn: string; displayOrder: number; isActive: boolean; createdAt: Date; updatedAt: Date }
    let staffList: StaffType[] = []
    if (staffId) {
      const staff = await prisma.staff.findUnique({ where: { id: staffId } })
      if (staff && staff.isActive) {
        staffList = [staff]
      }
    } else {
      staffList = await prisma.staff.findMany({
        where: { storeId, isActive: true },
      })
    }

    if (staffList.length === 0) {
      return NextResponse.json([])
    }

    // Get existing reservations for the date
    const existingReservations = await prisma.reservation.findMany({
      where: {
        storeId,
        status: { in: ['reserved', 'visited'] },
        startTime: {
          gte: startOfDay(targetDate),
          lte: endOfDay(targetDate),
        },
      },
    })

    // Generate time slots
    const allSlots = generateTimeSlots(businessHour.openTime, businessHour.closeTime, 30)

    // Filter slots that would end after closing time
    const closeTimeMinutes =
      parseInt(businessHour.closeTime.split(':')[0]) * 60 +
      parseInt(businessHour.closeTime.split(':')[1])

    const availableSlots = allSlots.map((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      const slotStart = new Date(targetDate)
      slotStart.setHours(hours, minutes, 0, 0)

      const slotEnd = addMinutes(slotStart, totalDuration)
      const slotEndMinutes = slotEnd.getHours() * 60 + slotEnd.getMinutes()

      // Check if slot ends after closing
      if (slotEndMinutes > closeTimeMinutes) {
        return { time, available: false }
      }

      // Check if slot is in the past
      if (slotStart < new Date()) {
        return { time, available: false }
      }

      // Check if any staff is available for this slot
      const availableStaff = staffList.filter((staff) => {
        const staffReservations = existingReservations.filter(
          (r) => r.staffId === staff.id
        )

        return !staffReservations.some((reservation) => {
          const reservationStart = new Date(reservation.startTime)
          const reservationEnd = new Date(reservation.endTime)

          // Check for overlap
          return (
            (slotStart >= reservationStart && slotStart < reservationEnd) ||
            (slotEnd > reservationStart && slotEnd <= reservationEnd) ||
            (slotStart <= reservationStart && slotEnd >= reservationEnd)
          )
        })
      })

      return {
        time,
        available: availableStaff.length > 0,
        staffIds: availableStaff.map((s) => s.id),
      }
    })

    return NextResponse.json(availableSlots)
  } catch (error) {
    console.error('Failed to get availability:', error)
    return NextResponse.json(
      { error: 'Failed to get availability' },
      { status: 500 }
    )
  }
}
