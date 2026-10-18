import type { Locale } from './types'

export interface LocaleStrings {
  months: readonly string[]
  weekdays: readonly string[]
  weekdaysShort: readonly string[]
  today: string
  clear: string
}

export const locales: Record<Locale, LocaleStrings> = {
  en: {
    months: [
      'Baisakh',
      'Jestha',
      'Asar',
      'Shrawan',
      'Bhadra',
      'Asoj',
      'Kartik',
      'Mangsir',
      'Poush',
      'Magh',
      'Falgun',
      'Chaitra',
    ],
    weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    today: 'Today',
    clear: 'Clear',
  },
  ne: {
    months: [
      'बैशाख',
      'जेठ',
      'असार',
      'साउन',
      'भदौ',
      'असोज',
      'कार्तिक',
      'मंसिर',
      'पुस',
      'माघ',
      'फागुन',
      'चैत',
    ],
    weekdays: ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'],
    weekdaysShort: ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि'],
    today: 'आज',
    clear: 'हटाउनुहोस्',
  },
}

const NEPALI_DIGITS = '०१२३४५६७८९'

/** Render ASCII digits in Devanagari for the `ne` locale. */
export function localizeDigits(value: string | number, locale: Locale): string {
  const text = String(value)
  return locale === 'ne' ? text.replace(/\d/g, (d) => NEPALI_DIGITS[Number(d)]!) : text
}

/** Convert Devanagari digits back to ASCII. */
export function toAsciiDigits(text: string): string {
  return text.replace(/[०-९]/g, (d) => String(NEPALI_DIGITS.indexOf(d)))
}
