import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const staffId = searchParams.get('staffId')
    const menuId = searchParams.get('menuId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const where: any = {}

    if (storeId) where.storeId = storeId
    if (staffId) where.staffId = staffId
    if (menuId) where.menuId = menuId
    if (status) where.status = status

    if (dateFrom || dateTo) {
      where.startTime = {}
      if (dateFrom) where.startTime.gte = startOfDay(parseISO(dateFrom))
      if (dateTo) where.startTime.lte = endOfDay(parseISO(dateTo))
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
      ]
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          store: true,
          menu: true,
          staff: true,
          coupon: true,
          campaign: true,
        },
        orderBy: { startTime: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ])

    return NextResponse.json({
      reservations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch reservations:', error)
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      storeId,
      menuId,
      staffId,
      startTime,
      endTime,
      customerName,
      customerEmail,
      customerPhone,
      channel = 'phone',
      status = 'reserved',
      adminNote,
    } = body

    const menu = await prisma.menu.findUnique({ where: { id: menuId } })
    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    const originalPrice = Math.floor(menu.price * (1 + menu.taxRate))

    const reservation = await prisma.reservation.create({
      data: {
        storeId,
        menuId,
        staffId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        customerName,
        customerEmail,
        customerPhone,
        channel,
        status,
        originalPrice,
        discountAmount: 0,
        finalPrice: originalPrice,
        adminNote,
        createdBy: 'admin',
      },
      include: {
        store: true,
        menu: true,
        staff: true,
      },
    })

    await prisma.reservationAuditLog.create({
      data: {
        reservationId: reservation.id,
        action: 'created',
        changes: JSON.stringify({ status, channel }),
        performedBy: 'admin',
      },
    })

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Failed to create reservation:', error)
    return NextResponse.json({ error: 'Failed to create reservation' }, { status: 500 })
  }
}
