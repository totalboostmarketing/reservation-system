import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: [{ type: 'asc' }, { language: 'asc' }],
    })
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Failed to fetch email templates:', error)
    return NextResponse.json({ error: 'Failed to fetch email templates' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, language, subject, bodyHtml, bodyText, isActive = true } = body
    const template = await prisma.emailTemplate.create({
      data: { type, language, subject, bodyHtml, bodyText, isActive },
    })
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Failed to create email template:', error)
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
  }
}
