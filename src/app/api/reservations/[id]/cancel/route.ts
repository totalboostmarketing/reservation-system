import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { canCancel } from '@/lib/utils'
import { sendReservationCancelEmail } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { token } = body

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        store: true,
        menu: true,
      },
    })

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Verify token
    if (reservation.cancelToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
    }

    // Check if already cancelled
    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })
    }

    // Check cancellation deadline (24 hours before)
    if (!canCancel(reservation.startTime)) {
      return NextResponse.json(
        { error: 'Cancellation deadline has passed' },
        { status: 400 }
      )
    }

    // Update reservation status
    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'cancelled',
        updatedBy: 'customer',
      },
    })

    // Create audit log
    await prisma.reservationAuditLog.create({
      data: {
        reservationId: id,
        action: 'cancelled',
        changes: JSON.stringify({ status: 'cancelled', previousStatus: reservation.status }),
        performedBy: 'customer',
      },
    })

    // Send cancellation email
    await sendReservationCancelEmail({
      id: reservation.id,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      language: reservation.language,
      startTime: reservation.startTime,
      store: reservation.store,
      menu: reservation.menu,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to cancel reservation:', error)
    return NextResponse.json({ error: 'Failed to cancel reservation' }, { status: 500 })
  }
}
