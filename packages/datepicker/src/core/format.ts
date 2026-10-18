import { getBsWeekday, isValidBsDate } from './convert'
import { locales, localizeDigits, toAsciiDigits } from './locale'
import type { BsDate, Locale } from './types'

const TOKENS = /YYYY|MMMM|MM|M|DD|D|dddd|ddd/g

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Format a BS date. Tokens: `YYYY`, `MM` (01–12), `M`, `DD`, `D`,
 * `MMMM` (month name), `dddd` (weekday), `ddd` (short weekday).
 * Digits are rendered in Devanagari when `locale` is `'ne'`.
 */
export function formatBs(date: BsDate, pattern = 'YYYY-MM-DD', locale: Locale = 'en'): string {
  const strings = locales[locale]
  const out = pattern.replace(TOKENS, (token) => {
    switch (token) {
      case 'YYYY':
        return String(date.year)
      case 'MMMM':
        return strings.months[date.month - 1]!
      case 'MM':
        return pad2(date.month)
      case 'M':
        return String(date.month)
      case 'DD':
        return pad2(date.day)
      case 'D':
        return String(date.day)
      case 'dddd':
        return strings.weekdays[getBsWeekday(date)]!
      default:
        return strings.weekdaysShort[getBsWeekday(date)]!
    }
  })
  return localizeDigits(out, locale)
}

/**
 * Parse `YYYY-MM-DD` (also `/` or `.` separators, ASCII or Devanagari digits).
 * Returns `null` when the text is not a valid, supported BS date.
 */
export function parseBs(text: string): BsDate | null {
  const match = /^\s*(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})\s*$/.exec(toAsciiDigits(text))
  if (!match) return null
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
  return isValidBsDate(date) ? date : null
}

/** Format the local calendar date of an AD `Date` as `YYYY-MM-DD`. */
export function formatAd(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

/** Parse an AD `YYYY-MM-DD` string to a `Date` at local midnight, or `null` if invalid. */
export function parseAd(text: string): Date | null {
  const match = /^\s*(\d{4})-(\d{1,2})-(\d{1,2})\s*$/.exec(text)
  if (!match) return null
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])]
  const date = new Date(year, month, day)
  const valid = date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
  return valid ? date : null
}
