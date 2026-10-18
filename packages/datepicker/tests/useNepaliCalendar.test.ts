import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useNepaliCalendar } from '../src/composables/useNepaliCalendar'
import type { BsDate } from '../src/core/types'

describe('useNepaliCalendar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2024, 3, 17)) // 2081-01-05 BS
  })
  afterEach(() => vi.useRealTimers())

  it('starts on today when nothing is selected', () => {
    const cal = useNepaliCalendar({ selected: null })
    expect(cal.focused.value).toEqual({ year: 2081, month: 1, day: 5 })
  })

  it('builds a 6×7 grid starting on Sunday', () => {
    const cal = useNepaliCalendar({ selected: { year: 2081, month: 1, day: 1 } })
    expect(cal.weeks.value).toHaveLength(6)
    expect(cal.weeks.value.every((w) => w.length === 7)).toBe(true)
    // 2081-01-01 is a Saturday, so the first row has 6 days from Chaitra 2080.
    const firstRow = cal.weeks.value[0]!
    expect(firstRow[6]!.date).toEqual({ year: 2081, month: 1, day: 1 })
    expect(firstRow[6]!.isSelected).toBe(true)
    expect(firstRow[0]!.inCurrentMonth).toBe(false)
  })

  it('marks today and disabled dates', () => {
    const cal = useNepaliCalendar({
      selected: null,
      min: { year: 2081, month: 1, day: 3 },
      isDateDisabled: (d) => d.day === 10,
    })
    const days = cal.weeks.value.flat().filter((d) => d?.inCurrentMonth)
    expect(days.find((d) => d!.isToday)!.date.day).toBe(5)
    expect(days.filter((d) => d!.isDisabled).map((d) => d!.date.day)).toEqual([1, 2, 10])
  })

  it('navigates and clamps to min/max', () => {
    const cal = useNepaliCalendar({
      selected: null,
      min: { year: 2081, month: 1, day: 1 },
      max: { year: 2081, month: 2, day: 10 },
    })
    expect(cal.canGoPrev.value).toBe(false)
    cal.moveMonths(1)
    expect(cal.focused.value).toEqual({ year: 2081, month: 2, day: 5 })
    expect(cal.canGoNext.value).toBe(false)
    cal.moveFocus(30)
    expect(cal.focused.value).toEqual({ year: 2081, month: 2, day: 10 })
    cal.moveMonths(-5)
    expect(cal.focused.value).toEqual({ year: 2081, month: 1, day: 1 })
  })

  it('jumps to a month and follows the selection', async () => {
    const selected = ref<BsDate | null>(null)
    const cal = useNepaliCalendar({ selected })
    cal.goTo(2070, 9)
    expect(cal.viewYear.value).toBe(2070)
    expect(cal.viewMonth.value).toBe(9)
    selected.value = { year: 2075, month: 3, day: 3 }
    await nextTick()
    expect(cal.focused.value).toEqual({ year: 2075, month: 3, day: 3 })
    cal.reset()
    expect(cal.focused.value).toEqual({ year: 2075, month: 3, day: 3 })
  })

  it('stays inside the supported data range', () => {
    const cal = useNepaliCalendar({ selected: { year: 1970, month: 1, day: 2 } })
    cal.moveFocus(-400)
    expect(cal.focused.value).toEqual({ year: 1970, month: 1, day: 1 })
    cal.moveMonths(-1)
    expect(cal.focused.value).toEqual({ year: 1970, month: 1, day: 1 })
    cal.focusDate({ year: 2090, month: 12, day: 1 })
    cal.moveMonths(1)
    expect(cal.focused.value).toEqual({ year: 2090, month: 12, day: 30 })
    expect(cal.weeks.value[5]![6]).toBeNull() // days after the last supported day
  })
})
