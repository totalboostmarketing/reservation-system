export const locales = ['ja', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'ja'

export function getMessages(locale: Locale) {
  return locale === 'en'
    ? require('./messages/en.json')
    : require('./messages/ja.json')
}
