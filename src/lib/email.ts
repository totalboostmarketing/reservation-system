import nodemailer from 'nodemailer'
import { prisma } from './prisma'

// メール送信の設定
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

/**
 * テンプレートの変数と条件分岐を処理する
 *
 * 対応する構文:
 * - {{変数名}} - 単純な変数置換
 * - {{#if 変数名}}...{{/if}} - 変数が存在する場合のみ表示
 * - {{#if 変数名}}...{{else}}...{{/if}} - 条件分岐
 * - {{#unless 変数名}}...{{/unless}} - 変数が存在しない場合のみ表示
 */
function processTemplate(
  template: string,
  variables: Record<string, string>
): string {
  let result = template

  // {{#if 変数名}}...{{else}}...{{/if}} の処理
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, ifContent, elseContent) => {
      const value = variables[varName]
      return (value && value.trim() !== '') ? ifContent : elseContent
    }
  )

  // {{#if 変数名}}...{{/if}} の処理（elseなし）
  result = result.replace(
    /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, varName, content) => {
      const value = variables[varName]
      return (value && value.trim() !== '') ? content : ''
    }
  )

  // {{#unless 変数名}}...{{/unless}} の処理（変数がない場合に表示）
  result = result.replace(
    /\{\{#unless\s+(\w+)\}\}([\s\S]*?)\{\{\/unless\}\}/g,
    (_, varName, content) => {
      const value = variables[varName]
      return (!value || value.trim() === '') ? content : ''
    }
  )

  // 通常の変数置換 {{変数名}}
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value || '')
  }

  return result
}

interface SendEmailOptions {
  to: string
  templateType: 'reservation_complete' | 'reservation_change' | 'reservation_cancel' | 'reminder'
  language: 'ja' | 'en'
  variables: {
    customerName: string
    storeName: string
    menuName: string
    staffName: string
    dateTime: string
    cancelUrl: string
    reservationId: string
    storePhone?: string
    storeAddress?: string
    price?: string
    duration?: string
  }
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    // SMTP設定がない場合はスキップ（開発環境用）
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('=== Email would be sent (SMTP not configured) ===')
      console.log('To:', options.to)
      console.log('Template:', options.templateType)
      console.log('Variables:', options.variables)
      console.log('===============================================')
      return true
    }

    // テンプレートを取得（有効なテンプレートを1つ取得）
    const template = await prisma.emailTemplate.findFirst({
      where: {
        type: options.templateType,
        language: options.language,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!template) {
      console.log(`Email template not found or inactive: ${options.templateType} (${options.language})`)
      return false
    }

    // 変数と条件分岐を処理
    const subject = processTemplate(template.subject, options.variables)
    const html = processTemplate(template.bodyHtml, options.variables)
    const text = processTemplate(template.bodyText, options.variables)

    // メール送信
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject,
      html,
      text,
    })

    console.log('Email sent:', info.messageId)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

// 予約完了メールを送信
export async function sendReservationCompleteEmail(reservation: {
  id: string
  customerName: string
  customerEmail: string
  language: string
  startTime: Date
  cancelToken: string
  finalPrice: number
  store: { nameJa: string; nameEn: string; phone: string; address: string }
  menu: { nameJa: string; nameEn: string; duration: number }
  staff?: { nameJa: string; nameEn: string } | null
}): Promise<boolean> {
  const isEn = reservation.language === 'en'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  return sendEmail({
    to: reservation.customerEmail,
    templateType: 'reservation_complete',
    language: isEn ? 'en' : 'ja',
    variables: {
      customerName: reservation.customerName,
      storeName: isEn ? reservation.store.nameEn : reservation.store.nameJa,
      menuName: isEn ? reservation.menu.nameEn : reservation.menu.nameJa,
      staffName: reservation.staff
        ? isEn ? reservation.staff.nameEn : reservation.staff.nameJa
        : '',
      dateTime: reservation.startTime.toLocaleString(isEn ? 'en-US' : 'ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cancelUrl: `${baseUrl}/${reservation.language}/reservation/${reservation.cancelToken}`,
      reservationId: reservation.id.slice(-8).toUpperCase(),
      storePhone: reservation.store.phone,
      storeAddress: reservation.store.address,
      price: reservation.finalPrice.toLocaleString() + (isEn ? ' yen' : '円'),
      duration: reservation.menu.duration + (isEn ? ' min' : '分'),
    },
  })
}

// 予約キャンセルメールを送信
export async function sendReservationCancelEmail(reservation: {
  id: string
  customerName: string
  customerEmail: string
  language: string
  startTime: Date
  store: { nameJa: string; nameEn: string; phone: string; address: string }
  menu: { nameJa: string; nameEn: string }
}): Promise<boolean> {
  const isEn = reservation.language === 'en'

  return sendEmail({
    to: reservation.customerEmail,
    templateType: 'reservation_cancel',
    language: isEn ? 'en' : 'ja',
    variables: {
      customerName: reservation.customerName,
      storeName: isEn ? reservation.store.nameEn : reservation.store.nameJa,
      menuName: isEn ? reservation.menu.nameEn : reservation.menu.nameJa,
      staffName: '',
      dateTime: reservation.startTime.toLocaleString(isEn ? 'en-US' : 'ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cancelUrl: '',
      reservationId: reservation.id.slice(-8).toUpperCase(),
    },
  })
}

// リマインドメールを送信
export async function sendReminderEmail(reservation: {
  id: string
  customerName: string
  customerEmail: string
  language: string
  startTime: Date
  cancelToken: string
  store: { nameJa: string; nameEn: string; phone: string; address: string }
  menu: { nameJa: string; nameEn: string; duration: number }
  staff?: { nameJa: string; nameEn: string } | null
}): Promise<boolean> {
  const isEn = reservation.language === 'en'
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  return sendEmail({
    to: reservation.customerEmail,
    templateType: 'reminder',
    language: isEn ? 'en' : 'ja',
    variables: {
      customerName: reservation.customerName,
      storeName: isEn ? reservation.store.nameEn : reservation.store.nameJa,
      menuName: isEn ? reservation.menu.nameEn : reservation.menu.nameJa,
      staffName: reservation.staff
        ? isEn ? reservation.staff.nameEn : reservation.staff.nameJa
        : '',
      dateTime: reservation.startTime.toLocaleString(isEn ? 'en-US' : 'ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      cancelUrl: `${baseUrl}/${reservation.language}/reservation/${reservation.cancelToken}`,
      reservationId: reservation.id.slice(-8).toUpperCase(),
      storePhone: reservation.store.phone,
      storeAddress: reservation.store.address,
      duration: reservation.menu.duration + (isEn ? ' min' : '分'),
    },
  })
}

// 翌日の予約にリマインドメールを送信（Cron Job用）
export async function sendReminderEmails(): Promise<{ sent: number; failed: number }> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)

  const dayAfterTomorrow = new Date(tomorrow)
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

  // 翌日の予約を取得
  const reservations = await prisma.reservation.findMany({
    where: {
      startTime: {
        gte: tomorrow,
        lt: dayAfterTomorrow,
      },
      status: 'reserved',
    },
    include: {
      store: true,
      menu: true,
      staff: true,
    },
  })

  let sent = 0
  let failed = 0

  for (const reservation of reservations) {
    const success = await sendReminderEmail({
      id: reservation.id,
      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      language: reservation.language,
      startTime: reservation.startTime,
      cancelToken: reservation.cancelToken,
      store: reservation.store,
      menu: reservation.menu,
      staff: reservation.staff,
    })

    if (success) {
      sent++
    } else {
      failed++
    }
  }

  console.log(`Reminder emails: ${sent} sent, ${failed} failed`)
  return { sent, failed }
}
