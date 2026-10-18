/** A Bikram Sambat calendar date. `month` is 1-based (1 = Baisakh). */
export interface BsDate {
  year: number
  month: number
  day: number
}

export type Locale = 'en' | 'ne'

/** Shape of the date picker's `v-model`: BS string, AD string, or both. */
export type ModelType = 'bs' | 'ad' | 'object'

/** `v-model` value when `modelType` is `'object'`. Both dates are `YYYY-MM-DD`. */
export interface NepaliDateValue {
  bs: string
  ad: string
}
