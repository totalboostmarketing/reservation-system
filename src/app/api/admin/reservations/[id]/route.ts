import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        store: true,
        menu: true,
        staff: true,
        coupon: true,
        campaign: true,
        auditLogs: {
          orderBy: { performedAt: 'desc' },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Failed to fetch reservation:', error)
    return NextResponse.json({ error: 'Failed to fetch reservation' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, staffId, startTime, endTime, menuId, adminNote, sendNotification } = body

    const currentReservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!currentReservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    const changes: Record<string, { from: any; to: any }> = {}
    const updateData: any = { updatedBy: 'admin' }

    if (status !== undefined && status !== currentReservation.status) {
      changes.status = { from: currentReservation.status, to: status }
      updateData.status = status
    }

    if (staffId !== undefined && staffId !== currentReservation.staffId) {
      changes.staffId = { from: currentReservation.staffId, to: staffId }
      updateData.staffId = staffId
    }

    if (startTime !== undefined) {
      const newStartTime = new Date(startTime)
      if (newStartTime.getTime() !== currentReservation.startTime.getTime()) {
        changes.startTime = { from: currentReservation.startTime, to: newStartTime }
        updateData.startTime = newStartTime
      }
    }

    if (endTime !== undefined) {
      const newEndTime = new Date(endTime)
      if (newEndTime.getTime() !== currentReservation.endTime.getTime()) {
        changes.endTime = { from: currentReservation.endTime, to: newEndTime }
        updateData.endTime = newEndTime
      }
    }

    if (menuId !== undefined && menuId !== currentReservation.menuId) {
      changes.menuId = { from: currentReservation.menuId, to: menuId }
      updateData.menuId = menuId

      // Recalculate price
      const menu = await prisma.menu.findUnique({ where: { id: menuId } })
      if (menu) {
        updateData.originalPrice = Math.floor(menu.price * (1 + menu.taxRate))
        updateData.finalPrice = updateData.originalPrice - currentReservation.discountAmount
      }
    }

    if (adminNote !== undefined) {
      updateData.adminNote = adminNote
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: updateData,
      include: {
        store: true,
        menu: true,
        staff: true,
      },
    })

    // Create audit log
    if (Object.keys(changes).length > 0) {
      await prisma.reservationAuditLog.create({
        data: {
          reservationId: id,
          action: changes.status ? 'status_changed' : 'updated',
          changes: JSON.stringify(changes),
          performedBy: 'admin',
        },
      })
    }

    // TODO: Send notification email if sendNotification is true

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update reservation:', error)
    return NextResponse.json({ error: 'Failed to update reservation' }, { status: 500 })
  }
}
