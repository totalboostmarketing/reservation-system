import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseISO, addMinutes } from 'date-fns'
import { calculateDiscount } from '@/lib/utils'
import { sendReservationCompleteEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      storeId,
      menuId,
      staffId,
      date,
      time,
      customerName,
      customerEmail,
      customerPhone,
      couponCode,
      language = 'ja',
    } = body

    // Validate required fields
    if (!storeId || !menuId || !date || !time || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get menu details
    const menu = await prisma.menu.findUnique({ where: { id: menuId } })
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    // Calculate times
    const startTime = parseISO(`${date}T${time}:00`)
    const endTime = addMinutes(startTime, menu.duration + menu.bufferBefore + menu.bufferAfter)

    // Calculate price
    let originalPrice = Math.floor(menu.price * (1 + menu.taxRate))
    let discountAmount = 0
    let couponId: string | null = null
    let campaignId: string | null = null

    // Check for coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode },
        include: {
          couponStores: true,
          couponMenus: true,
        },
      })

      if (coupon && coupon.isActive) {
        const now = new Date()
        const isValidPeriod = now >= coupon.startDate && now <= coupon.endDate
        const isValidStore = coupon.couponStores.length === 0 ||
          coupon.couponStores.some((cs) => cs.storeId === storeId)
        const isValidMenu = coupon.couponMenus.length === 0 ||
          coupon.couponMenus.some((cm) => cm.menuId === menuId)
        const isUnderUsageLimit = !coupon.maxUsageTotal || coupon.usageCount < coupon.maxUsageTotal
        const meetsMinPurchase = !coupon.minPurchaseAmount || originalPrice >= coupon.minPurchaseAmount

        if (isValidPeriod && isValidStore && isValidMenu && isUnderUsageLimit && meetsMinPurchase) {
          discountAmount = calculateDiscount(originalPrice, coupon.discountType as 'percent' | 'fixed', coupon.discountValue)
          couponId = coupon.id

          // Increment coupon usage
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usageCount: { increment: 1 } },
          })
        }
      }
    }

    // Check for active campaign
    const campaigns = await prisma.campaign.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
        campaignStores: { some: { storeId } },
        campaignMenus: { some: { menuId } },
      },
      orderBy: { discountValue: 'desc' },
    })

    if (campaigns.length > 0 && !couponId) {
      const campaign = campaigns[0]
      discountAmount = calculateDiscount(originalPrice, campaign.discountType as 'percent' | 'fixed', campaign.discountValue)
      campaignId = campaign.id
    }

    const finalPrice = originalPrice - discountAmount

    // Assign staff if not specified
    let assignedStaffId = staffId
    if (!assignedStaffId) {
      // Find available staff
      const availableStaff = await prisma.staff.findMany({
        where: { storeId, isActive: true },
      })

      const existingReservations = await prisma.reservation.findMany({
        where: {
          storeId,
          status: { in: ['reserved', 'visited'] },
          OR: [
            {
              startTime: { lt: endTime },
              endTime: { gt: startTime },
            },
          ],
        },
      })

      const bookedStaffIds = new Set(existingReservations.map((r) => r.staffId))
      const freeStaff = availableStaff.find((s) => !bookedStaffIds.has(s.id))

      if (freeStaff) {
        assignedStaffId = freeStaff.id
      } else if (availableStaff.length > 0) {
        assignedStaffId = availableStaff[0].id
      }
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        storeId,
        menuId,
        staffId: assignedStaffId,
        startTime,
        endTime,
        customerName,
        customerEmail,
        customerPhone,
        language,
        originalPrice,
        discountAmount,
        finalPrice,
        couponId,
        campaignId,
      },
      include: {
        store: true,
        menu: true,
        staff: true,
      },
    })

    // Create audit log
    await prisma.reservationAuditLog.create({
      data: {
        reservationId: reservation.id,
        action: 'created',
        changes: JSON.stringify({ status: 'reserved' }),
        performedBy: 'customer',
      },
    })

    // Send confirmation email
    await sendReservationCompleteEmail({
      id: reservation.id,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      language: reservation.language,
      startTime: reservation.startTime,
      cancelToken: reservation.cancelToken,
      finalPrice: reservation.finalPrice,
      store: reservation.store,
      menu: reservation.menu,
      staff: reservation.staff,
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Failed to create reservation:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const reservation = await prisma.reservation.findUnique({
      where: { cancelToken: token },
      include: {
        store: true,
        menu: true,
        staff: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Failed to fetch reservation:', error)
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 })
  }
}
