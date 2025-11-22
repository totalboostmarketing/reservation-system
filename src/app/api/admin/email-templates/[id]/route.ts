import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { subject, bodyHtml, bodyText, isActive } = body
    await prisma.emailTemplate.update({ where: { id }, data: { subject, bodyHtml, bodyText, isActive } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update email template:', error)
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 })
  }
}
