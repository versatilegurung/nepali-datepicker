<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import type { CalendarDay } from '../composables/useNepaliCalendar'
import { adToBs, bsToAd, compareBs } from '../core/convert'
import { formatAd, formatBs, parseAd, parseBs } from '../core/format'
import { locales } from '../core/locale'
import type { BsDate, Locale, ModelType, NepaliDateValue } from '../core/types'
import NepaliCalendar from './NepaliCalendar.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    /** Shape of `v-model`: BS string, AD string, or `{ bs, ad }`. */
    modelType?: ModelType
    locale?: Locale
    /** Display format of the input, see `formatBs`. Typing always accepts `YYYY-MM-DD`. */
    format?: string
    /** Earliest selectable BS date, `YYYY-MM-DD`. */
    min?: string
    /** Latest selectable BS date, `YYYY-MM-DD`. */
    max?: string
    disabledDates?: (date: BsDate) => boolean
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    clearable?: boolean
    /** Render only the calendar, always visible, without an input. */
    inline?: boolean
    /** Teleport the popover (e.g. `'body'`) to escape `overflow: hidden` parents. */
    teleportTo?: string | HTMLElement
  }>(),
  {
    modelType: 'bs',
    locale: 'en',
    format: 'YYYY-MM-DD',
    min: undefined,
    max: undefined,
    disabledDates: undefined,
    placeholder: undefined,
    clearable: false,
    teleportTo: undefined,
  },
)

const model = defineModel<string | NepaliDateValue | null>({ default: null })

const emit = defineEmits<{
  /** Fired when the user picks, types or clears a date (not on programmatic changes). */
  change: [value: string | NepaliDateValue | null]
  open: []
  close: []
}>()

defineSlots<{
  day?(props: { day: CalendarDay }): unknown
  header?(props: { year: number; month: number }): unknown
  footer?(): unknown
}>()

function toBs(value: string | NepaliDateValue | null): BsDate | null {
  if (!value) return null
  try {
    if (typeof value === 'object') return parseBs(value.bs)
    if (props.modelType === 'ad') {
      const ad = parseAd(value)
      return ad ? adToBs(ad) : null
    }
    return parseBs(value)
  } catch {
    return null // AD date outside the supported BS range
  }
}

function fromBs(date: BsDate | null): string | NepaliDateValue | null {
  if (!date) return null
  const bs = formatBs(date)
  if (props.modelType === 'bs') return bs
  const ad = formatAd(bsToAd(date))
  return props.modelType === 'ad' ? ad : { bs, ad }
}

const selected = computed(() => toBs(model.value))
const minDate = computed(() => (props.min ? parseBs(props.min) : null))
const maxDate = computed(() => (props.max ? parseBs(props.max) : null))

function commit(date: BsDate | null) {
  const value = fromBs(date)
  model.value = value
  emit('change', value)
}

// ---- input ---------------------------------------------------------------

const input = ref<HTMLInputElement>()
const displayText = computed(() =>
  selected.value ? formatBs(selected.value, props.format, props.locale) : '',
)

function onInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const text = target.value.trim()
  if (!text) return commit(null)
  const date = parseBs(text)
  const blocked = !date || isOutOfBounds(date) || props.disabledDates?.(date)
  if (blocked) {
    target.value = displayText.value // revert invalid input
    return
  }
  commit(date)
}

function isOutOfBounds(date: BsDate) {
  return (
    (minDate.value && compareBs(date, minDate.value) < 0) ||
    (maxDate.value && compareBs(date, maxDate.value) > 0)
  )
}

function clear() {
  commit(null)
  input.value?.focus()
}

// ---- popover -------------------------------------------------------------

const isOpen = ref(false)
const root = ref<HTMLElement>()
const panel = ref<HTMLElement>()
const calendar = ref<InstanceType<typeof NepaliCalendar>>()
const panelId = useId()
const panelStyle = ref<Record<string, string>>({})

async function open(focusCalendar = false) {
  if (props.disabled || props.readonly || props.inline) return
  if (!isOpen.value) {
    isOpen.value = true
    emit('open')
    document.addEventListener('pointerdown', onOutsidePointer, true)
    if (props.teleportTo) {
      window.addEventListener('scroll', positionPanel, true)
      window.addEventListener('resize', positionPanel)
    }
  }
  await nextTick()
  positionPanel()
  if (focusCalendar) calendar.value?.focus()
}

function close(returnFocus = false) {
  if (!isOpen.value) return
  isOpen.value = false
  emit('close')
  removeListeners()
  if (returnFocus) input.value?.focus()
}

function removeListeners() {
  if (typeof document === 'undefined') return
  document.removeEventListener('pointerdown', onOutsidePointer, true)
  window.removeEventListener('scroll', positionPanel, true)
  window.removeEventListener('resize', positionPanel)
}

onBeforeUnmount(removeListeners)

const isInside = (node: EventTarget | null) =>
  node instanceof Node && (!!root.value?.contains(node) || !!panel.value?.contains(node))

function onOutsidePointer(event: PointerEvent) {
  if (!isInside(event.target)) close()
}

function onFocusOut(event: FocusEvent) {
  if (event.relatedTarget && !isInside(event.relatedTarget)) close()
}

/** With `teleportTo`, the panel is `position: fixed`, aligned under the input. */
function positionPanel() {
  if (!props.teleportTo || !root.value) return
  const rect = root.value.getBoundingClientRect()
  panelStyle.value = { position: 'fixed', top: `${rect.bottom + 4}px`, left: `${rect.left}px` }
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || (event.key === 'Enter' && !isOpen.value)) {
    event.preventDefault()
    open(true)
  } else if (event.key === 'Escape') {
    close()
  }
}

function onPanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close(true)
  }
}

function onSelect(date: BsDate) {
  commit(date)
  if (!props.inline) close(true)
}

// Reset the calendar view to the selection each time the popover opens.
watch(isOpen, (value) => value && calendar.value?.reset())

const clearLabel = computed(() => locales[props.locale].clear)
</script>

<template>
  <NepaliCalendar
    v-if="inline"
    class="ndp ndp--inline"
    :model-value="selected"
    :min="minDate"
    :max="maxDate"
    :locale="locale"
    :disabled-dates="disabledDates"
    v-bind="$attrs"
    @select="onSelect"
  >
    <template v-if="$slots.day" #day="slotProps"><slot name="day" v-bind="slotProps" /></template>
    <template v-if="$slots.header" #header="slotProps">
      <slot name="header" v-bind="slotProps" />
    </template>
    <template v-if="$slots.footer" #footer><slot name="footer" /></template>
  </NepaliCalendar>

  <div
    v-else
    ref="root"
    class="ndp"
    :class="{ 'ndp--open': isOpen, 'ndp--disabled': disabled }"
    @focusout="onFocusOut"
  >
    <div class="ndp-field">
      <input
        ref="input"
        class="ndp-input"
        type="text"
        autocomplete="off"
        role="combobox"
        aria-haspopup="dialog"
        :aria-expanded="isOpen"
        :aria-controls="isOpen ? panelId : undefined"
        :value="displayText"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        v-bind="$attrs"
        @click="open()"
        @keydown="onInputKeydown"
        @change="onInputChange"
      />
      <button
        v-if="clearable && selected && !disabled && !readonly"
        type="button"
        class="ndp-clear"
        :aria-label="clearLabel"
        @click="clear"
      >
        ×
      </button>
    </div>

    <Teleport :to="teleportTo" :disabled="!teleportTo">
      <div
        v-if="isOpen"
        :id="panelId"
        ref="panel"
        class="ndp-panel"
        :class="{ 'ndp-panel--teleported': teleportTo }"
        :style="panelStyle"
        role="dialog"
        aria-modal="false"
        @keydown="onPanelKeydown"
        @focusout="onFocusOut"
      >
        <NepaliCalendar
          ref="calendar"
          :model-value="selected"
          :min="minDate"
          :max="maxDate"
          :locale="locale"
          :disabled-dates="disabledDates"
          @select="onSelect"
        >
          <template v-if="$slots.day" #day="slotProps"
            ><slot name="day" v-bind="slotProps"
          /></template>
          <template v-if="$slots.header" #header="slotProps">
            <slot name="header" v-bind="slotProps" />
          </template>
          <template v-if="$slots.footer" #footer><slot name="footer" /></template>
        </NepaliCalendar>
      </div>
    </Teleport>
  </div>
</template>
