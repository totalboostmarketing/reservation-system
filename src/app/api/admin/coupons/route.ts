import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { reservations: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(coupons)
  } catch (error) {
    console.error('Failed to fetch coupons:', error)
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, nameJa, nameEn, discountType, discountValue, startDate, endDate, minPurchaseAmount, maxUsageTotal, maxUsagePerUser } = body

    const coupon = await prisma.coupon.create({
      data: {
        code, nameJa, nameEn, discountType, discountValue,
        startDate: new Date(startDate), endDate: new Date(endDate),
        minPurchaseAmount, maxUsageTotal, maxUsagePerUser,
      },
    })
    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error('Failed to create coupon:', error)
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 })
  }
}
