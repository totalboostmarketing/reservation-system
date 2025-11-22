import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startOfDay, endOfDay, parseISO, format } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const storeId = searchParams.get('storeId')

    const where: any = {}

    if (dateFrom || dateTo) {
      where.startTime = {}
      if (dateFrom) where.startTime.gte = startOfDay(parseISO(dateFrom))
      if (dateTo) where.startTime.lte = endOfDay(parseISO(dateTo))
    }

    if (storeId) where.storeId = storeId

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        store: true,
        menu: true,
        staff: true,
        coupon: true,
        campaign: true,
      },
      orderBy: { startTime: 'asc' },
    })

    // Generate CSV
    const headers = [
      '予約ID',
      '予約日時',
      '来店日',
      '来店時刻',
      '終了時刻',
      '店舗',
      'メニュー',
      '担当者',
      '顧客名',
      'メールアドレス',
      '電話番号',
      'チャネル',
      'ステータス',
      '元料金',
      '割引額',
      '最終料金',
      'クーポン',
      'キャンペーン',
      '作成日時',
    ]

    const rows = reservations.map((r) => [
      r.id,
      format(r.createdAt, 'yyyy-MM-dd HH:mm'),
      format(r.startTime, 'yyyy-MM-dd'),
      format(r.startTime, 'HH:mm'),
      format(r.endTime, 'HH:mm'),
      r.store.nameJa,
      r.menu.nameJa,
      r.staff?.nameJa || '',
      r.customerName,
      r.customerEmail,
      r.customerPhone,
      r.channel,
      r.status,
      r.originalPrice,
      r.discountAmount,
      r.finalPrice,
      r.coupon?.code || '',
      r.campaign?.nameJa || '',
      format(r.createdAt, 'yyyy-MM-dd HH:mm'),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="reservations_${format(new Date(), 'yyyyMMdd')}.csv"`,
      },
    })
  } catch (error) {
    console.error('Failed to export reservations:', error)
    return NextResponse.json({ error: 'Failed to export reservations' }, { status: 500 })
  }
}
