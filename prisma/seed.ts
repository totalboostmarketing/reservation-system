import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: '管理者',
      role: 'admin',
    },
  })
  console.log('Created admin:', admin.email)

  // Create stores
  const store1 = await prisma.store.upsert({
    where: { id: 'store-shibuya' },
    update: {},
    create: {
      id: 'store-shibuya',
      nameJa: '渋谷店',
      nameEn: 'Shibuya Store',
      address: '東京都渋谷区渋谷1-1-1',
      phone: '03-1234-5678',
      email: 'shibuya@example.com',
      bedCount: 3,
      mapUrl: 'https://maps.google.com',
    },
  })

  const store2 = await prisma.store.upsert({
    where: { id: 'store-shinjuku' },
    update: {},
    create: {
      id: 'store-shinjuku',
      nameJa: '新宿店',
      nameEn: 'Shinjuku Store',
      address: '東京都新宿区新宿2-2-2',
      phone: '03-2345-6789',
      email: 'shinjuku@example.com',
      bedCount: 4,
      mapUrl: 'https://maps.google.com',
    },
  })
  console.log('Created stores:', store1.nameJa, store2.nameJa)

  // Create business hours for stores
  const days = [0, 1, 2, 3, 4, 5, 6]
  for (const store of [store1, store2]) {
    for (const day of days) {
      await prisma.businessHour.upsert({
        where: { storeId_dayOfWeek: { storeId: store.id, dayOfWeek: day } },
        update: {},
        create: {
          storeId: store.id,
          dayOfWeek: day,
          openTime: day === 0 || day === 6 ? '10:00' : '10:00',
          closeTime: day === 0 || day === 6 ? '20:00' : '22:00',
          isOpen: true,
        },
      })
    }
  }
  console.log('Created business hours')

  // Create menus
  const menus = [
    {
      id: 'menu-body-60',
      nameJa: 'ボディケア 60分',
      nameEn: 'Body Care 60min',
      descriptionJa: '全身をほぐすスタンダードコース',
      descriptionEn: 'Standard full body massage course',
      duration: 60,
      bufferAfter: 10,
      price: 6000,
    },
    {
      id: 'menu-body-90',
      nameJa: 'ボディケア 90分',
      nameEn: 'Body Care 90min',
      descriptionJa: 'じっくり全身をほぐすロングコース',
      descriptionEn: 'Extended full body massage course',
      duration: 90,
      bufferAfter: 10,
      price: 8500,
    },
    {
      id: 'menu-foot-40',
      nameJa: 'フットケア 40分',
      nameEn: 'Foot Care 40min',
      descriptionJa: '足裏から膝下までをケア',
      descriptionEn: 'Foot and lower leg massage',
      duration: 40,
      bufferAfter: 10,
      price: 4500,
    },
    {
      id: 'menu-head-30',
      nameJa: 'ヘッドケア 30分',
      nameEn: 'Head Care 30min',
      descriptionJa: '頭皮から首・肩までリラックス',
      descriptionEn: 'Relaxing head, neck and shoulder massage',
      duration: 30,
      bufferAfter: 10,
      price: 3500,
    },
  ]

  for (const menu of menus) {
    const created = await prisma.menu.upsert({
      where: { id: menu.id },
      update: {},
      create: menu,
    })

    // Link to both stores
    for (const store of [store1, store2]) {
      await prisma.storeMenu.upsert({
        where: { storeId_menuId: { storeId: store.id, menuId: created.id } },
        update: {},
        create: { storeId: store.id, menuId: created.id },
      })
    }
  }
  console.log('Created menus')

  // Create staff
  const staffData = [
    { id: 'staff-1', storeId: store1.id, nameJa: '山田 太郎', nameEn: 'Taro Yamada' },
    { id: 'staff-2', storeId: store1.id, nameJa: '佐藤 花子', nameEn: 'Hanako Sato' },
    { id: 'staff-3', storeId: store1.id, nameJa: '鈴木 一郎', nameEn: 'Ichiro Suzuki' },
    { id: 'staff-4', storeId: store2.id, nameJa: '田中 美咲', nameEn: 'Misaki Tanaka' },
    { id: 'staff-5', storeId: store2.id, nameJa: '高橋 健二', nameEn: 'Kenji Takahashi' },
    { id: 'staff-6', storeId: store2.id, nameJa: '伊藤 さくら', nameEn: 'Sakura Ito' },
    { id: 'staff-7', storeId: store2.id, nameJa: '渡辺 大輔', nameEn: 'Daisuke Watanabe' },
  ]

  for (const staff of staffData) {
    await prisma.staff.upsert({
      where: { id: staff.id },
      update: {},
      create: staff,
    })
  }
  console.log('Created staff')

  // Create campaigns
  const campaign = await prisma.campaign.upsert({
    where: { id: 'campaign-spring' },
    update: {},
    create: {
      id: 'campaign-spring',
      nameJa: '春の癒しキャンペーン',
      nameEn: 'Spring Relaxation Campaign',
      descriptionJa: '全コース10%OFF！',
      descriptionEn: '10% off all courses!',
      discountType: 'percent',
      discountValue: 10,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      isActive: true,
    },
  })

  for (const store of [store1, store2]) {
    await prisma.campaignStore.upsert({
      where: { campaignId_storeId: { campaignId: campaign.id, storeId: store.id } },
      update: {},
      create: { campaignId: campaign.id, storeId: store.id },
    })
  }

  for (const menu of menus) {
    await prisma.campaignMenu.upsert({
      where: { campaignId_menuId: { campaignId: campaign.id, menuId: menu.id } },
      update: {},
      create: { campaignId: campaign.id, menuId: menu.id },
    })
  }
  console.log('Created campaign')

  // Create coupons
  const coupon = await prisma.coupon.upsert({
    where: { id: 'coupon-welcome' },
    update: {},
    create: {
      id: 'coupon-welcome',
      code: 'WELCOME500',
      nameJa: '初回限定500円OFF',
      nameEn: 'First Visit ¥500 Off',
      discountType: 'fixed',
      discountValue: 500,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      maxUsageTotal: 100,
      isActive: true,
    },
  })
  console.log('Created coupon:', coupon.code)

  // Create email templates
  const emailTemplates = [
    {
      type: 'reservation_complete',
      language: 'ja',
      subject: '【ご予約完了】{{storeName}} - {{dateTime}}',
      bodyHtml: `<p>{{customerName}} 様</p>
<p>ご予約ありがとうございます。</p>
<p>予約内容：</p>
<ul>
<li>店舗：{{storeName}}</li>
<li>メニュー：{{menuName}}</li>
<li>日時：{{dateTime}}</li>
<li>担当：{{staffName}}</li>
</ul>
<p>キャンセルは予約時刻の24時間前まで可能です。</p>`,
      bodyText: '{{customerName}} 様\n\nご予約ありがとうございます。',
    },
    {
      type: 'reservation_complete',
      language: 'en',
      subject: '[Reservation Confirmed] {{storeName}} - {{dateTime}}',
      bodyHtml: `<p>Dear {{customerName}},</p>
<p>Thank you for your reservation.</p>
<p>Details:</p>
<ul>
<li>Store: {{storeName}}</li>
<li>Menu: {{menuName}}</li>
<li>Date/Time: {{dateTime}}</li>
<li>Staff: {{staffName}}</li>
</ul>
<p>Cancellation is available up to 24 hours before your appointment.</p>`,
      bodyText: 'Dear {{customerName}},\n\nThank you for your reservation.',
    },
  ]

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type_language: { type: template.type, language: template.language } },
      update: {},
      create: template,
    })
  }
  console.log('Created email templates')

  // Create system settings
  const settings = [
    { key: 'timezone', value: 'Asia/Tokyo' },
    { key: 'default_language', value: 'ja' },
    { key: 'reminder_enabled', value: 'true' },
    { key: 'cancel_deadline_hours', value: '24' },
    { key: 'booking_range_days', value: '90' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('Created system settings')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
