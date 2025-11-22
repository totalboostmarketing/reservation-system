import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params

    const storeMenus = await prisma.storeMenu.findMany({
      where: {
        storeId,
        isActive: true,
        menu: { isActive: true },
      },
      include: {
        menu: true,
      },
      orderBy: { menu: { displayOrder: 'asc' } },
    })

    const menus = storeMenus.map((sm) => sm.menu)

    return NextResponse.json(menus)
  } catch (error) {
    console.error('Failed to fetch menus:', error)
    return NextResponse.json({ error: 'Failed to fetch menus' }, { status: 500 })
  }
}
