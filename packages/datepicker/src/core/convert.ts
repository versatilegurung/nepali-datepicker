import { BS_END_YEAR, BS_EPOCH_AD, BS_MONTH_LENGTHS, BS_START_YEAR } from './calendar-data'
import type { BsDate } from './types'

const MS_PER_DAY = 86_400_000
const EPOCH_UTC = Date.UTC(BS_EPOCH_AD.year, BS_EPOCH_AD.month, BS_EPOCH_AD.day)

/** Day offset (from 1970-01-01 BS) of Baisakh 1 for each year; last entry is the end of the range. */
const yearStartOffsets: number[] = [0]
for (const months of BS_MONTH_LENGTHS) {
  yearStartOffsets.push(yearStartOffsets.at(-1)! + months.reduce((a, b) => a + b, 0))
}

/** Total number of days covered by the calendar data. */
const TOTAL_DAYS = yearStartOffsets.at(-1)!

function monthLengths(year: number): readonly number[] {
  const months = BS_MONTH_LENGTHS[year - BS_START_YEAR]
  if (!months) {
    throw new RangeError(
      `BS year ${year} is outside the supported range ${BS_START_YEAR}–${BS_END_YEAR}`,
    )
  }
  return months
}

/** Number of days in a BS month. Throws `RangeError` for unsupported years or invalid months. */
export function getDaysInBsMonth(year: number, month: number): number {
  const length = monthLengths(year)[month - 1]
  if (length === undefined) throw new RangeError(`Invalid BS month ${month}`)
  return length
}

export function isValidBsDate(date: BsDate): boolean {
  const { year, month, day } = date
  if (![year, month, day].every(Number.isInteger)) return false
  if (year < BS_START_YEAR || year > BS_END_YEAR || month < 1 || month > 12) return false
  return day >= 1 && day <= getDaysInBsMonth(year, month)
}

function assertValid(date: BsDate): void {
  if (!isValidBsDate(date)) {
    throw new RangeError(`Invalid or unsupported BS date ${date.year}-${date.month}-${date.day}`)
  }
}

/** Days since 1970-01-01 BS. */
function toDayIndex(date: BsDate): number {
  assertValid(date)
  const months = monthLengths(date.year)
  let index = yearStartOffsets[date.year - BS_START_YEAR]!
  for (let m = 0; m < date.month - 1; m++) index += months[m]!
  return index + date.day - 1
}

function fromDayIndex(index: number): BsDate {
  if (!Number.isInteger(index) || index < 0 || index >= TOTAL_DAYS) {
    throw new RangeError('Date is outside the supported BS range')
  }
  // yearStartOffsets is sorted; a linear scan over ~120 years is fast enough and simple.
  let y = 0
  while (yearStartOffsets[y + 1]! <= index) y++
  let rest = index - yearStartOffsets[y]!
  const months = BS_MONTH_LENGTHS[y]!
  let m = 0
  while (rest >= months[m]!) rest -= months[m++]!
  return { year: BS_START_YEAR + y, month: m + 1, day: rest + 1 }
}

/**
 * Convert an AD `Date` to BS. Only the local calendar date (year/month/day) of
 * `date` is used; the time of day is ignored.
 */
export function adToBs(date: Date): BsDate {
  const utc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return fromDayIndex(Math.round((utc - EPOCH_UTC) / MS_PER_DAY))
}

/** Convert a BS date to an AD `Date` at local midnight. */
export function bsToAd(date: BsDate): Date {
  const utc = new Date(EPOCH_UTC + toDayIndex(date) * MS_PER_DAY)
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate())
}

/** Add (or subtract) a number of days to a BS date. */
export function addBsDays(date: BsDate, days: number): BsDate {
  return fromDayIndex(toDayIndex(date) + days)
}

/** Add months, clamping the day to the target month's length (e.g. 32 → 30). */
export function addBsMonths(date: BsDate, months: number): BsDate {
  const total = date.year * 12 + (date.month - 1) + months
  const year = Math.floor(total / 12)
  const month = (total % 12) + 1
  return { year, month, day: Math.min(date.day, getDaysInBsMonth(year, month)) }
}

/** Negative if `a` is before `b`, 0 if equal, positive if after. */
export function compareBs(a: BsDate, b: BsDate): number {
  return a.year - b.year || a.month - b.month || a.day - b.day
}

/** Day of week, 0 = Sunday … 6 = Saturday. */
export function getBsWeekday(date: BsDate): number {
  return bsToAd(date).getDay()
}

/** Today's date in BS, according to the local clock. */
export function todayBs(): BsDate {
  return adToBs(new Date())
}
