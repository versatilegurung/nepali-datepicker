# @subashgurung/vue-nepali-datepicker

Nepali (Bikram Sambat) date picker for **Vue 3**. Accessible, themeable with CSS variables,
SSR-safe, and with zero-dependency BS ⇄ AD conversion (1970–2090 BS).

## Install

```sh
pnpm add @subashgurung/vue-nepali-datepicker
```

```ts
// main.ts
import '@subashgurung/vue-nepali-datepicker/style.css'
```

## Usage

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { NepaliDatePicker } from '@subashgurung/vue-nepali-datepicker'

const date = ref<string | null>(null) // '2081-01-15' (BS)
</script>

<template>
  <NepaliDatePicker v-model="date" clearable placeholder="YYYY-MM-DD" />
</template>
```

Or register globally: `app.use(NepaliDatePickerPlugin)`.

### Props

| Prop                                  | Type                           | Default        | Notes                                             |
| ------------------------------------- | ------------------------------ | -------------- | ------------------------------------------------- |
| `v-model`                             | `string \| { bs, ad } \| null` | `null`         | Shape depends on `modelType`                      |
| `modelType`                           | `'bs' \| 'ad' \| 'object'`     | `'bs'`         | BS `YYYY-MM-DD`, AD `YYYY-MM-DD`, or `{ bs, ad }` |
| `locale`                              | `'en' \| 'ne'`                 | `'en'`         | `ne` uses Devanagari names and digits             |
| `format`                              | `string`                       | `'YYYY-MM-DD'` | Input display: `YYYY MM M DD D MMMM dddd ddd`     |
| `min` / `max`                         | `string`                       | –              | BS `YYYY-MM-DD`                                   |
| `disabledDates`                       | `(date: BsDate) => boolean`    | –              |                                                   |
| `clearable`                           | `boolean`                      | `false`        |                                                   |
| `inline`                              | `boolean`                      | `false`        | Calendar only, no input                           |
| `teleportTo`                          | `string \| HTMLElement`        | –              | e.g. `'body'`, to escape `overflow: hidden`       |
| `disabled`, `readonly`, `placeholder` |                                |                |                                                   |

Other attributes (`id`, `name`, `required`, `aria-*`, …) are forwarded to the `<input>`.
Typing into the input accepts `YYYY-MM-DD` with ASCII or Devanagari digits.

**Events:** `update:modelValue`, `change` (user changes only), `open`, `close`.
**Slots:** `day` (`{ day }`), `header` (`{ year, month }`), `footer`.

### Keyboard

Arrows move by day/week, `Home`/`End` to week start/end, `PageUp`/`PageDown` by month
(`Shift` for year), `Enter`/`Space` selects, `Esc` closes. `ArrowDown` in the input opens the calendar.

### Theming

Override CSS variables on `.ndp, .ndp-panel` (or any ancestor):

```css
.ndp,
.ndp-panel {
  --ndp-primary: #2563eb;
  --ndp-radius: 4px;
}
.dark .ndp,
.dark .ndp-panel {
  --ndp-bg: #1f2328;
  --ndp-fg: #e6edf3;
  --ndp-border: #3d444d;
  --ndp-hover: #2d333b;
}
```

See `src/styles/datepicker.css` for the full list.

## Utilities

```ts
import { adToBs, bsToAd, formatBs, parseBs, todayBs } from '@subashgurung/vue-nepali-datepicker'

adToBs(new Date(2024, 3, 13)) // { year: 2081, month: 1, day: 1 }
bsToAd({ year: 2081, month: 1, day: 1 }) // Date 2024-04-13 (local midnight)
formatBs({ year: 2081, month: 1, day: 1 }, 'D MMMM YYYY', 'ne') // '१ बैशाख २०८१'
```

Also exported: `useNepaliCalendar` (headless grid/navigation state), `NepaliCalendar`,
`addBsDays`, `addBsMonths`, `compareBs`, `getDaysInBsMonth`, `isValidBsDate`, `formatAd`, `parseAd`.

## Calendar data

BS month lengths aren't computed by a formula; Nepal publishes them every year. Years up to
`BS_LAST_VERIFIED_YEAR` (2083) are verified. Later years are provisional projections and get
corrected in patch releases. Keep this package updated.

## License

MIT
