import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nameJa, nameEn, displayOrder, isActive } = body

    const staff = await prisma.staff.update({
      where: { id },
      data: { nameJa, nameEn, displayOrder, isActive },
      include: { store: true },
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Failed to update staff:', error)
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.staff.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete staff:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
