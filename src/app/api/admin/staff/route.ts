import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    const where: any = {}
    if (storeId) where.storeId = storeId

    const staff = await prisma.staff.findMany({
      where,
      include: {
        store: true,
        _count: { select: { reservations: true } },
      },
      orderBy: [{ store: { nameJa: 'asc' } }, { displayOrder: 'asc' }],
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Failed to fetch staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { storeId, nameJa, nameEn, displayOrder } = body

    const staff = await prisma.staff.create({
      data: {
        storeId,
        nameJa,
        nameEn,
        displayOrder: displayOrder || 0,
      },
      include: { store: true },
    })

    return NextResponse.json(staff, { status: 201 })
  } catch (error) {
    console.error('Failed to create staff:', error)
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 })
  }
}
