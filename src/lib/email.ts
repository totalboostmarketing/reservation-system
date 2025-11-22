import nodemailer from 'nodemailer'
import { prisma } from './prisma'

// メール送信の設定
// 本番環境では環境変数から設定を読み込む
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

// テンプレートの変数を実際の値に置き換える
function replaceVariables(
  template: string,
  variables: Record<string, string>
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '')
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

    // テンプレートを取得
    const template = await prisma.emailTemplate.findUnique({
      where: {
        type_language: {
          type: options.templateType,
          language: options.language,
        },
      },
    })

    if (!template || !template.isActive) {
      console.log(`Email template not found or inactive: ${options.templateType} (${options.language})`)
      return false
    }

    // 変数を置き換え
    const subject = replaceVariables(template.subject, options.variables)
    const html = replaceVariables(template.bodyHtml, options.variables)
    const text = replaceVariables(template.bodyText, options.variables)

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
  store: { nameJa: string; nameEn: string; phone: string; address: string }
  menu: { nameJa: string; nameEn: string }
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
        : isEn ? 'Not specified' : '指名なし',
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
