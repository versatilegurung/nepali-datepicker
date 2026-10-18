export { default as NepaliDatePicker } from './components/NepaliDatePicker.vue'
export { default as NepaliCalendar } from './components/NepaliCalendar.vue'
export { NepaliDatePickerPlugin } from './plugin'
export {
  useNepaliCalendar,
  type CalendarDay,
  type UseNepaliCalendarOptions,
} from './composables/useNepaliCalendar'

export {
  addBsDays,
  addBsMonths,
  adToBs,
  bsToAd,
  compareBs,
  getBsWeekday,
  getDaysInBsMonth,
  isValidBsDate,
  todayBs,
} from './core/convert'
export { formatAd, formatBs, parseAd, parseBs } from './core/format'
export { locales, localizeDigits, toAsciiDigits, type LocaleStrings } from './core/locale'
export { BS_END_YEAR, BS_LAST_VERIFIED_YEAR, BS_START_YEAR } from './core/calendar-data'
export type { BsDate, Locale, ModelType, NepaliDateValue } from './core/types'
