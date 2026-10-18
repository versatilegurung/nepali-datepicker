<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useNepaliCalendar, type CalendarDay } from '../composables/useNepaliCalendar'
import { compareBs } from '../core/convert'
import { formatBs } from '../core/format'
import { locales, localizeDigits } from '../core/locale'
import type { BsDate, Locale } from '../core/types'

const props = withDefaults(
  defineProps<{
    min?: BsDate | null
    max?: BsDate | null
    locale?: Locale
    disabledDates?: (date: BsDate) => boolean
    /** Show the "Today" button. */
    showToday?: boolean
  }>(),
  { min: null, max: null, locale: 'en', disabledDates: undefined, showToday: true },
)

const model = defineModel<BsDate | null>({ default: null })

const emit = defineEmits<{
  /** A date was picked by the user (click, Enter or Space). */
  select: [date: BsDate]
}>()

defineSlots<{
  day?(props: { day: CalendarDay }): unknown
  header?(props: { year: number; month: number }): unknown
  footer?(): unknown
}>()

const calendar = useNepaliCalendar({
  selected: model,
  min: () => props.min,
  max: () => props.max,
  isDateDisabled: (date) => props.disabledDates?.(date) ?? false,
})
const { focused, viewYear, viewMonth, weeks, years, canGoPrev, canGoNext } = calendar

const strings = computed(() => locales[props.locale])
const n = (value: number) => localizeDigits(value, props.locale)
const label = (date: BsDate) => formatBs(date, 'dddd, D MMMM YYYY', props.locale)
const isFocused = (date: BsDate) => compareBs(date, focused.value) === 0

const grid = ref<HTMLElement>()

function select(date: BsDate) {
  if (calendar.isDisabled(date)) return
  calendar.focusDate(date)
  model.value = date
  emit('select', date)
}

function selectToday() {
  if (calendar.today) select(calendar.today)
}

/** Move DOM focus to the focused day button (only while focus is already in the grid). */
async function syncDomFocus(force = false) {
  await nextTick()
  if (!grid.value) return
  if (!force && !grid.value.contains(document.activeElement)) return
  grid.value.querySelector<HTMLElement>('[data-focused="true"]')?.focus()
}

watch(focused, () => syncDomFocus())

function onKeydown(event: KeyboardEvent) {
  const actions: Record<string, () => void> = {
    ArrowLeft: () => calendar.moveFocus(-1),
    ArrowRight: () => calendar.moveFocus(1),
    ArrowUp: () => calendar.moveFocus(-7),
    ArrowDown: () => calendar.moveFocus(7),
    Home: () => calendar.moveFocus(-weekdayOfFocused()),
    End: () => calendar.moveFocus(6 - weekdayOfFocused()),
    PageUp: () => calendar.moveMonths(event.shiftKey ? -12 : -1),
    PageDown: () => calendar.moveMonths(event.shiftKey ? 12 : 1),
  }
  const action = actions[event.key]
  if (!action) return
  event.preventDefault()
  action()
}

function weekdayOfFocused(): number {
  for (const week of weeks.value) {
    const index = week.findIndex((day) => day && isFocused(day.date))
    if (index !== -1) return index
  }
  return 0
}

defineExpose({
  /** Move keyboard focus to the focused (selected or today's) day. */
  focus: () => syncDomFocus(true),
  /** Reset the view to the selected date (or today). */
  reset: calendar.reset,
})
</script>

<template>
  <div class="ndp-calendar" :lang="locale === 'ne' ? 'ne' : undefined">
    <div class="ndp-header">
      <slot name="header" :year="viewYear" :month="viewMonth">
        <button
          type="button"
          class="ndp-nav"
          :disabled="!canGoPrev"
          aria-label="Previous month"
          @click="calendar.moveMonths(-1)"
        >
          ‹
        </button>
        <div class="ndp-selects" aria-live="polite">
          <select
            class="ndp-select"
            aria-label="Month"
            :value="viewMonth"
            @change="calendar.goTo(viewYear, Number(($event.target as HTMLSelectElement).value))"
          >
            <option v-for="(name, i) in strings.months" :key="name" :value="i + 1">
              {{ name }}
            </option>
          </select>
          <select
            class="ndp-select"
            aria-label="Year"
            :value="viewYear"
            @change="calendar.goTo(Number(($event.target as HTMLSelectElement).value), viewMonth)"
          >
            <option v-for="year in years" :key="year" :value="year">{{ n(year) }}</option>
          </select>
        </div>
        <button
          type="button"
          class="ndp-nav"
          :disabled="!canGoNext"
          aria-label="Next month"
          @click="calendar.moveMonths(1)"
        >
          ›
        </button>
      </slot>
    </div>

    <table
      ref="grid"
      class="ndp-grid"
      role="grid"
      :aria-label="`${strings.months[viewMonth - 1]} ${n(viewYear)}`"
      @keydown="onKeydown"
    >
      <thead>
        <tr>
          <th
            v-for="(short, i) in strings.weekdaysShort"
            :key="short"
            scope="col"
            :abbr="strings.weekdays[i]"
            class="ndp-weekday"
          >
            {{ short }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(week, w) in weeks" :key="w">
          <td
            v-for="(day, d) in week"
            :key="day?.key ?? `empty-${w}-${d}`"
            role="gridcell"
            :aria-selected="day ? day.isSelected : undefined"
          >
            <button
              v-if="day"
              type="button"
              class="ndp-day"
              :class="{
                'ndp-day--outside': !day.inCurrentMonth,
                'ndp-day--today': day.isToday,
                'ndp-day--selected': day.isSelected,
                'ndp-day--saturday': d === 6,
              }"
              :tabindex="isFocused(day.date) ? 0 : -1"
              :data-focused="isFocused(day.date)"
              :aria-label="label(day.date)"
              :aria-current="day.isToday ? 'date' : undefined"
              :aria-disabled="day.isDisabled || undefined"
              @click="select(day.date)"
            >
              <slot name="day" :day="day">{{ n(day.date.day) }}</slot>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="showToday || $slots.footer" class="ndp-footer">
      <slot name="footer">
        <button
          type="button"
          class="ndp-link"
          :disabled="!calendar.today || calendar.isDisabled(calendar.today)"
          @click="selectToday"
        >
          {{ strings.today }}
        </button>
      </slot>
    </div>
  </div>
</template>
