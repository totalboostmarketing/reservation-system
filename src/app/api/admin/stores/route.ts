import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      include: {
        businessHours: true,
        _count: {
          select: { staff: true, reservations: true },
        },
      },
      orderBy: { nameJa: 'asc' },
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nameJa,
      nameEn,
      address,
      phone,
      email,
      mapUrl,
      latitude,
      longitude,
      bedCount,
      businessHours,
    } = body

    const store = await prisma.store.create({
      data: {
        nameJa,
        nameEn,
        address,
        phone,
        email,
        mapUrl,
        latitude,
        longitude,
        bedCount: bedCount || 1,
        businessHours: businessHours
          ? {
              create: businessHours.map((bh: any) => ({
                dayOfWeek: bh.dayOfWeek,
                openTime: bh.openTime,
                closeTime: bh.closeTime,
                isOpen: bh.isOpen,
              })),
            }
          : undefined,
      },
      include: {
        businessHours: true,
      },
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error('Failed to create store:', error)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
