import { describe, expect, it } from 'vitest'
import { formatAd, formatBs, parseAd, parseBs } from '../src/core/format'
import { localizeDigits, toAsciiDigits } from '../src/core/locale'

const date = { year: 2081, month: 1, day: 5 }

describe('formatBs', () => {
  it('formats with the default pattern', () => {
    expect(formatBs(date)).toBe('2081-01-05')
  })

  it('supports names and Nepali digits', () => {
    expect(formatBs(date, 'dddd, D MMMM YYYY')).toBe('Wednesday, 5 Baisakh 2081')
    expect(formatBs(date, 'D MMMM YYYY, ddd', 'ne')).toBe('५ बैशाख २०८१, बुध')
    expect(formatBs(date, 'YYYY/M/D', 'ne')).toBe('२०८१/१/५')
  })
})

describe('parseBs', () => {
  it.each([
    ['2081-01-05', date],
    [' 2081/1/5 ', date],
    ['2081.01.05', date],
    ['२०८१-०१-०५', date],
  ])('parses %j', (text, expected) => {
    expect(parseBs(text)).toEqual(expected)
  })

  it.each(['', 'abc', '2081-01-32', '2081-13-01', '1960-01-01', '81-1-5'])('rejects %j', (text) =>
    expect(parseBs(text)).toBeNull(),
  )
})

describe('AD helpers', () => {
  it('formats and parses local dates', () => {
    expect(formatAd(new Date(2024, 3, 3))).toBe('2024-04-03')
    expect(parseAd('2024-04-03')).toEqual(new Date(2024, 3, 3))
    expect(parseAd('2023-02-29')).toBeNull()
    expect(parseAd('nope')).toBeNull()
  })
})

describe('digits', () => {
  it('converts both ways', () => {
    expect(localizeDigits(2081, 'ne')).toBe('२०८१')
    expect(localizeDigits(2081, 'en')).toBe('2081')
    expect(toAsciiDigits('२०८१')).toBe('2081')
  })
})
