import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const { storeId } = await params
    const { searchParams } = new URL(request.url)
    const menuId = searchParams.get('menuId')

    let staff = await prisma.staff.findMany({
      where: {
        storeId,
        isActive: true,
      },
      orderBy: { displayOrder: 'asc' },
    })

    // Filter by menu if menuId is provided
    if (menuId) {
      const staffMenus = await prisma.staffMenu.findMany({
        where: { menuId },
        select: { staffId: true },
      })
      const staffIds = new Set(staffMenus.map((sm) => sm.staffId))

      // If no staff-menu associations exist, return all staff
      if (staffIds.size > 0) {
        staff = staff.filter((s) => staffIds.has(s.id))
      }
    }

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Failed to fetch staff:', error)
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}
