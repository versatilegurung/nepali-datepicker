import type { App, Plugin } from 'vue'
import NepaliCalendar from './components/NepaliCalendar.vue'
import NepaliDatePicker from './components/NepaliDatePicker.vue'

/** Optional global registration: `app.use(NepaliDatePickerPlugin)`. */
export const NepaliDatePickerPlugin: Plugin = {
  install(app: App) {
    app.component('NepaliDatePicker', NepaliDatePicker)
    app.component('NepaliCalendar', NepaliCalendar)
  },
}

declare module 'vue' {
  export interface GlobalComponents {
    NepaliDatePicker: typeof NepaliDatePicker
    NepaliCalendar: typeof NepaliCalendar
  }
}
