import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import { BS_END_YEAR, BS_START_YEAR } from '../core/calendar-data'
import {
  addBsDays,
  addBsMonths,
  compareBs,
  getBsWeekday,
  getDaysInBsMonth,
  todayBs,
} from '../core/convert'
import type { BsDate } from '../core/types'

export interface CalendarDay {
  date: BsDate
  /** Stable `YYYY-M-D` key, handy for `v-for`. */
  key: string
  /** `false` for the leading/trailing days of the adjacent months. */
  inCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  isDisabled: boolean
}

export interface UseNepaliCalendarOptions {
  selected: MaybeRefOrGetter<BsDate | null | undefined>
  min?: MaybeRefOrGetter<BsDate | null | undefined>
  max?: MaybeRefOrGetter<BsDate | null | undefined>
  /** Extra disabled dates. Reactive state read inside it is tracked. */
  isDateDisabled?: (date: BsDate) => boolean
}

const RANGE_START: BsDate = { year: BS_START_YEAR, month: 1, day: 1 }
const RANGE_END: BsDate = {
  year: BS_END_YEAR,
  month: 12,
  day: getDaysInBsMonth(BS_END_YEAR, 12),
}

/** Today in BS, or `null` if the local clock is outside the supported range. */
function safeToday(): BsDate | null {
  try {
    return todayBs()
  } catch {
    return null
  }
}

const keyOf = (d: BsDate) => `${d.year}-${d.month}-${d.day}`
const isSame = (a: BsDate | null | undefined, b: BsDate) => !!a && compareBs(a, b) === 0

function clamp(date: BsDate, lo: BsDate, hi: BsDate): BsDate {
  if (compareBs(date, lo) < 0) return lo
  if (compareBs(date, hi) > 0) return hi
  return date
}

/**
 * Headless state for a BS month view: the 6×7 day grid, month navigation and a
 * keyboard-focus cursor. The visible month always follows the focused date.
 */
export function useNepaliCalendar(options: UseNepaliCalendarOptions) {
  const today = safeToday()

  /** Navigation bounds: the supported data range narrowed by `min`/`max`. */
  const lowerBound = computed(() => {
    const min = toValue(options.min)
    return min && compareBs(min, RANGE_START) > 0 ? min : RANGE_START
  })
  const upperBound = computed(() => {
    const max = toValue(options.max)
    return max && compareBs(max, RANGE_END) < 0 ? max : RANGE_END
  })

  const initialFocus = () =>
    clamp(toValue(options.selected) ?? today ?? RANGE_END, lowerBound.value, upperBound.value)

  const focused = ref<BsDate>(initialFocus())

  watch(
    () => toValue(options.selected),
    (selected) => {
      if (selected) focused.value = clamp(selected, lowerBound.value, upperBound.value)
    },
  )

  const viewYear = computed(() => focused.value.year)
  const viewMonth = computed(() => focused.value.month)

  function isDisabled(date: BsDate): boolean {
    if (compareBs(date, lowerBound.value) < 0 || compareBs(date, upperBound.value) > 0) return true
    return options.isDateDisabled?.(date) ?? false
  }

  const weeks = computed<(CalendarDay | null)[][]>(() => {
    const first: BsDate = { year: viewYear.value, month: viewMonth.value, day: 1 }
    const selected = toValue(options.selected)
    const cells: (CalendarDay | null)[] = []
    for (let i = -getBsWeekday(first); cells.length < 42; i++) {
      let date: BsDate
      try {
        date = i === 0 ? first : addBsDays(first, i)
      } catch {
        // Before the first / after the last supported day.
        cells.push(null)
        continue
      }
      cells.push({
        date,
        key: keyOf(date),
        inCurrentMonth: date.month === first.month,
        isToday: isSame(today, date),
        isSelected: isSame(selected, date),
        isDisabled: isDisabled(date),
      })
    }
    return Array.from({ length: 6 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
  })

  function focusDate(date: BsDate): void {
    focused.value = clamp(date, lowerBound.value, upperBound.value)
  }

  function moveFocus(days: number): void {
    // Avoid RangeError at the edges of the data range by clamping the offset.
    try {
      focusDate(addBsDays(focused.value, days))
    } catch {
      focusDate(days < 0 ? lowerBound.value : upperBound.value)
    }
  }

  function moveMonths(months: number): void {
    const target = focused.value.year * 12 + focused.value.month - 1 + months
    if (Math.floor(target / 12) < BS_START_YEAR) return focusDate(lowerBound.value)
    if (Math.floor(target / 12) > BS_END_YEAR) return focusDate(upperBound.value)
    focusDate(addBsMonths(focused.value, months))
  }

  function goTo(year: number, month: number): void {
    const day = Math.min(focused.value.day, getDaysInBsMonth(year, month))
    focusDate({ year, month, day })
  }

  const canGoPrev = computed(
    () =>
      viewYear.value * 12 + viewMonth.value > lowerBound.value.year * 12 + lowerBound.value.month,
  )
  const canGoNext = computed(
    () =>
      viewYear.value * 12 + viewMonth.value < upperBound.value.year * 12 + upperBound.value.month,
  )

  const years = computed(() =>
    Array.from(
      { length: upperBound.value.year - lowerBound.value.year + 1 },
      (_, i) => lowerBound.value.year + i,
    ),
  )

  return {
    today,
    focused,
    viewYear,
    viewMonth,
    weeks,
    years,
    canGoPrev,
    canGoNext,
    isDisabled,
    focusDate,
    moveFocus,
    moveMonths,
    goTo,
    reset: () => focusDate(initialFocus()),
  }
}
