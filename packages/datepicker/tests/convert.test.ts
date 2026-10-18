import { describe, expect, it } from 'vitest'
import { BS_END_YEAR, BS_MONTH_LENGTHS, BS_START_YEAR } from '../src/core/calendar-data'
import {
  addBsDays,
  addBsMonths,
  adToBs,
  bsToAd,
  compareBs,
  getBsWeekday,
  getDaysInBsMonth,
  isValidBsDate,
} from '../src/core/convert'
import { formatAd } from '../src/core/format'

const ad = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(y, m - 1, d)
}

describe('calendar data', () => {
  it('has 12 months of 29–32 days and 365/366 days per year', () => {
    for (const months of BS_MONTH_LENGTHS) {
      expect(months).toHaveLength(12)
      for (const len of months) expect(len).toBeGreaterThanOrEqual(29)
      for (const len of months) expect(len).toBeLessThanOrEqual(32)
      expect([365, 366]).toContain(months.reduce((a, b) => a + b, 0))
    }
  })
})

describe('known BS ⇄ AD pairs', () => {
  // Nepali New Year (Baisakh 1) and other independently known dates.
  const pairs: [string, string][] = [
    ['1970-01-01', '1913-04-13'],
    ['2000-01-01', '1943-04-14'],
    ['2072-06-03', '2015-09-20'], // Constitution of Nepal promulgated
    ['2080-01-01', '2023-04-14'],
    ['2081-01-01', '2024-04-13'],
    ['2082-01-01', '2025-04-14'],
    ['2083-01-01', '2026-04-14'],
  ]

  it.each(pairs)('%s BS = %s AD', (bs, adIso) => {
    const [year, month, day] = bs.split('-').map(Number) as [number, number, number]
    expect(formatAd(bsToAd({ year, month, day }))).toBe(adIso)
    expect(adToBs(ad(adIso))).toEqual({ year, month, day })
  })
})

describe('round trip over the whole supported range', () => {
  it('bsToAd ∘ adToBs is the identity, one day apart each step', () => {
    let date = { year: BS_START_YEAR, month: 1, day: 1 }
    let prevAd = bsToAd(date)
    let count = 0
    for (;;) {
      expect(adToBs(bsToAd(date))).toEqual(date)
      if (
        date.year === BS_END_YEAR &&
        date.month === 12 &&
        date.day === getDaysInBsMonth(BS_END_YEAR, 12)
      )
        break
      date = addBsDays(date, 1)
      const nextAd = bsToAd(date)
      expect(Math.round((nextAd.getTime() - prevAd.getTime()) / 86_400_000)).toBe(1)
      prevAd = nextAd
      count++
    }
    expect(count).toBeGreaterThan(40_000)
  })
})

describe('validation and range errors', () => {
  it('validates dates', () => {
    expect(isValidBsDate({ year: 2081, month: 2, day: 32 })).toBe(true)
    expect(isValidBsDate({ year: 2081, month: 1, day: 32 })).toBe(false)
    expect(isValidBsDate({ year: 2081, month: 13, day: 1 })).toBe(false)
    expect(isValidBsDate({ year: 2081, month: 1, day: 0 })).toBe(false)
    expect(isValidBsDate({ year: 1969, month: 1, day: 1 })).toBe(false)
    expect(isValidBsDate({ year: 2081.5, month: 1, day: 1 })).toBe(false)
  })

  it('throws RangeError outside the supported range', () => {
    expect(() => bsToAd({ year: BS_END_YEAR + 1, month: 1, day: 1 })).toThrow(RangeError)
    expect(() => adToBs(ad('1900-01-01'))).toThrow(RangeError)
    expect(() => getDaysInBsMonth(2081, 0)).toThrow(RangeError)
  })

  it('ignores time of day', () => {
    expect(adToBs(new Date(2024, 3, 13, 23, 59))).toEqual({ year: 2081, month: 1, day: 1 })
  })
})

describe('arithmetic helpers', () => {
  it('adds days across month and year boundaries', () => {
    expect(addBsDays({ year: 2080, month: 12, day: 30 }, 1)).toEqual({
      year: 2081,
      month: 1,
      day: 1,
    })
    expect(addBsDays({ year: 2081, month: 1, day: 1 }, -1)).toEqual({
      year: 2080,
      month: 12,
      day: 30,
    })
  })

  it('adds months and clamps the day', () => {
    expect(addBsMonths({ year: 2081, month: 2, day: 32 }, 1)).toEqual({
      year: 2081,
      month: 3,
      day: 31,
    })
    expect(addBsMonths({ year: 2081, month: 1, day: 5 }, -1)).toEqual({
      year: 2080,
      month: 12,
      day: 5,
    })
    expect(addBsMonths({ year: 2081, month: 12, day: 5 }, 13)).toEqual({
      year: 2083,
      month: 1,
      day: 5,
    })
  })

  it('compares and gets weekdays', () => {
    expect(
      compareBs({ year: 2081, month: 1, day: 1 }, { year: 2081, month: 1, day: 2 }),
    ).toBeLessThan(0)
    expect(compareBs({ year: 2081, month: 1, day: 1 }, { year: 2081, month: 1, day: 1 })).toBe(0)
    // 2081-01-01 BS = Saturday 13 April 2024
    expect(getBsWeekday({ year: 2081, month: 1, day: 1 })).toBe(6)
  })
})
