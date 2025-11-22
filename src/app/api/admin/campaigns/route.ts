import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        campaignStores: { include: { store: true } },
        campaignMenus: { include: { menu: true } },
        _count: { select: { reservations: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(campaigns)
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nameJa, nameEn, descriptionJa, descriptionEn, discountType, discountValue, startDate, endDate, storeIds, menuIds } = body

    const campaign = await prisma.campaign.create({
      data: {
        nameJa,
        nameEn,
        descriptionJa,
        descriptionEn,
        discountType,
        discountValue,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        campaignStores: storeIds?.length ? { create: storeIds.map((storeId: string) => ({ storeId })) } : undefined,
        campaignMenus: menuIds?.length ? { create: menuIds.map((menuId: string) => ({ menuId })) } : undefined,
      },
    })
    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 })
  }
}
