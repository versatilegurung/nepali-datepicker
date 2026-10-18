<script setup lang="ts">
import { ref } from 'vue'
import {
  NepaliDatePicker,
  getBsWeekday,
  type BsDate,
  type NepaliDateValue,
} from '@versatilegurung/vue-nepali-datepicker'

const bs = ref<string | null>('2081-01-01')
const ad = ref<string | null>(null)
const both = ref<NepaliDateValue | null>(null)
const nepali = ref<string | null>(null)
const inline = ref<string | null>(null)

const isSaturday = (date: BsDate) => getBsWeekday(date) === 6
</script>

<template>
  <main>
    <h1>Nepali Date Picker</h1>

    <section>
      <h2>BS model (default)</h2>
      <NepaliDatePicker v-model="bs" clearable placeholder="YYYY-MM-DD" />
      <code>{{ bs }}</code>
    </section>

    <section>
      <h2>AD model</h2>
      <NepaliDatePicker v-model="ad" model-type="ad" format="D MMMM YYYY" />
      <code>{{ ad }}</code>
    </section>

    <section>
      <h2>Both, with min/max</h2>
      <NepaliDatePicker v-model="both" model-type="object" min="2080-01-01" max="2082-12-30" />
      <code>{{ both }}</code>
    </section>

    <section>
      <h2>Nepali locale, Saturdays disabled</h2>
      <NepaliDatePicker
        v-model="nepali"
        locale="ne"
        format="D MMMM YYYY, dddd"
        :disabled-dates="isSaturday"
      />
      <code>{{ nepali }}</code>
    </section>

    <section>
      <h2>Inline</h2>
      <NepaliDatePicker v-model="inline" inline />
      <code>{{ inline }}</code>
    </section>
  </main>
</template>

<style>
body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 24px;
}
section {
  margin-bottom: 28px;
}
code {
  display: block;
  margin-top: 6px;
  color: #57606a;
}
</style>
