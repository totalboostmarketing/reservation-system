import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { nameJa, nameEn, descriptionJa, descriptionEn, discountType, discountValue, startDate, endDate, isActive, storeIds, menuIds } = body

    await prisma.campaign.update({
      where: { id },
      data: { nameJa, nameEn, descriptionJa, descriptionEn, discountType, discountValue, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, isActive },
    })

    if (storeIds !== undefined) {
      await prisma.campaignStore.deleteMany({ where: { campaignId: id } })
      if (storeIds.length > 0) {
        await prisma.campaignStore.createMany({ data: storeIds.map((storeId: string) => ({ campaignId: id, storeId })) })
      }
    }
    if (menuIds !== undefined) {
      await prisma.campaignMenu.deleteMany({ where: { campaignId: id } })
      if (menuIds.length > 0) {
        await prisma.campaignMenu.createMany({ data: menuIds.map((menuId: string) => ({ campaignId: id, menuId })) })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.campaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
