import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        storeMenus: { include: { store: true } },
        _count: { select: { reservations: true } },
      },
      orderBy: { displayOrder: 'asc' },
    })

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Failed to fetch menus:', error)
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      nameJa,
      nameEn,
      descriptionJa,
      descriptionEn,
      duration,
      bufferBefore,
      bufferAfter,
      price,
      taxRate,
      displayOrder,
      storeIds,
    } = body

    const menu = await prisma.menu.create({
      data: {
        nameJa,
        nameEn,
        descriptionJa,
        descriptionEn,
        duration,
        bufferBefore: bufferBefore || 0,
        bufferAfter: bufferAfter || 0,
        price,
        taxRate: taxRate || 0.1,
        displayOrder: displayOrder || 0,
        storeMenus: storeIds?.length
          ? {
              create: storeIds.map((storeId: string) => ({ storeId })),
            }
          : undefined,
      },
      include: {
        storeMenus: { include: { store: true } },
      },
    })

    return NextResponse.json(menu, { status: 201 })
  } catch (error) {
    console.error('Failed to create menu:', error)
    return NextResponse.json({ error: 'Failed to create menu' }, { status: 500 })
  }
}
