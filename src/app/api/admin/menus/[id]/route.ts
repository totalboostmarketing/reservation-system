import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        storeMenus: { include: { store: true } },
      },
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error) {
    console.error('Failed to fetch menu:', error)
    return NextResponse.json({ error: 'Failed to fetch menu' }, { status: 500 })
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
      descriptionJa,
      descriptionEn,
      duration,
      bufferBefore,
      bufferAfter,
      price,
      taxRate,
      displayOrder,
      isActive,
      storeIds,
    } = body

    const menu = await prisma.menu.update({
      where: { id },
      data: {
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
        isActive,
      },
    })

    // Update store associations if provided
    if (storeIds !== undefined) {
      await prisma.storeMenu.deleteMany({ where: { menuId: id } })
      if (storeIds.length > 0) {
        await prisma.storeMenu.createMany({
          data: storeIds.map((storeId: string) => ({ menuId: id, storeId })),
        })
      }
    }

    const updated = await prisma.menu.findUnique({
      where: { id },
      include: { storeMenus: { include: { store: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update menu:', error)
    return NextResponse.json({ error: 'Failed to update menu' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.menu.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete menu:', error)
    return NextResponse.json({ error: 'Failed to delete menu' }, { status: 500 })
  }
}
