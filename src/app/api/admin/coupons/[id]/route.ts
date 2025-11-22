import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { code, nameJa, nameEn, discountType, discountValue, startDate, endDate, minPurchaseAmount, maxUsageTotal, maxUsagePerUser, isActive } = body

    await prisma.coupon.update({
      where: { id },
      data: { code, nameJa, nameEn, discountType, discountValue, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, minPurchaseAmount, maxUsageTotal, maxUsagePerUser, isActive },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update coupon:', error)
    return NextResponse.json({ error: 'Failed to update coupon' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.coupon.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete coupon:', error)
    return NextResponse.json({ error: 'Failed to delete coupon' }, { status: 500 })
  }
}
