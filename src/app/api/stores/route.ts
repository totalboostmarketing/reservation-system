import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: {
        businessHours: true,
      },
      orderBy: { nameJa: 'asc' },
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Failed to fetch stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}
