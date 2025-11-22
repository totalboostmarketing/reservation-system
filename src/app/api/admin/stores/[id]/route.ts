import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        businessHours: true,
        staff: true,
        storeMenus: { include: { menu: true } },
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('Failed to fetch store:', error)
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isActive,
      businessHours,
    } = body

    // Update store
    const store = await prisma.store.update({
      where: { id },
      data: {
        nameJa,
        nameEn,
        address,
        phone,
        email,
        mapUrl,
        latitude,
        longitude,
        bedCount,
        isActive,
      },
    })

    // Update business hours if provided
    if (businessHours) {
      // Delete existing and recreate
      await prisma.businessHour.deleteMany({ where: { storeId: id } })
      await prisma.businessHour.createMany({
        data: businessHours.map((bh: any) => ({
          storeId: id,
          dayOfWeek: bh.dayOfWeek,
          openTime: bh.openTime,
          closeTime: bh.closeTime,
          isOpen: bh.isOpen,
        })),
      })
    }

    const updated = await prisma.store.findUnique({
      where: { id },
      include: { businessHours: true },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update store:', error)
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if there are active reservations
    const activeReservations = await prisma.reservation.count({
      where: {
        storeId: id,
        status: 'reserved',
        startTime: { gte: new Date() },
      },
    })

    if (activeReservations > 0) {
      return NextResponse.json(
        { error: 'Cannot delete store with active reservations' },
        { status: 400 }
      )
    }

    await prisma.store.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete store:', error)
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
  }
}
