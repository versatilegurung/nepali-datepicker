import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import NepaliCalendar from '../src/components/NepaliCalendar.vue'
import NepaliDatePicker from '../src/components/NepaliDatePicker.vue'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2024, 3, 17)) // 2081-01-05 BS
})
afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
})

const mountPicker = (props: Record<string, unknown> = {}) =>
  mount(NepaliDatePicker, { props: { modelValue: null, ...props }, attachTo: document.body })

const dayButton = (wrapper: ReturnType<typeof mountPicker>, day: number) =>
  wrapper.findAll('.ndp-day:not(.ndp-day--outside)').find((b) => b.text() === String(day))!

describe('NepaliDatePicker', () => {
  it('shows the formatted value', () => {
    const wrapper = mountPicker({ modelValue: '2081-01-05', format: 'D MMMM YYYY' })
    expect(wrapper.find('input').element.value).toBe('5 Baisakh 2081')
  })

  it('opens on click, selects a day and closes', async () => {
    const wrapper = mountPicker()
    await wrapper.find('input').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    expect(wrapper.emitted('open')).toHaveLength(1)

    await dayButton(wrapper, 12).trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2081-01-12'])
    expect(wrapper.emitted('change')![0]).toEqual(['2081-01-12'])
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it.each([
    ['ad', '2024-04-24'],
    ['object', { bs: '2081-01-12', ad: '2024-04-24' }],
  ])('emits modelType=%s values', async (modelType, expected) => {
    const wrapper = mountPicker({ modelType })
    await wrapper.find('input').trigger('click')
    await dayButton(wrapper, 12).trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([expected])
  })

  it('reads AD model values', () => {
    const wrapper = mountPicker({ modelType: 'ad', modelValue: '2024-04-13' })
    expect(wrapper.find('input').element.value).toBe('2081-01-01')
  })

  it('accepts typed dates and reverts invalid ones', async () => {
    const wrapper = mountPicker({ max: '2081-12-30' })
    const input = wrapper.find('input')
    await input.setValue('२०८१-०२-०३')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2081-02-03'])

    await input.setValue('2090-01-01') // beyond max → reverted
    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(input.element.value).toBe('2081-02-03')

    await input.setValue('')
    expect(wrapper.emitted('update:modelValue')![1]).toEqual([null])
  })

  it('does not select disabled dates', async () => {
    const wrapper = mountPicker({ disabledDates: (d: { day: number }) => d.day === 12 })
    await wrapper.find('input').trigger('click')
    await dayButton(wrapper, 12).trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('opens with ArrowDown, closes with Escape', async () => {
    const wrapper = mountPicker()
    await wrapper.find('input').trigger('keydown', { key: 'ArrowDown' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await wrapper.find('[role="dialog"]').trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('closes on outside pointerdown', async () => {
    const wrapper = mountPicker()
    await wrapper.find('input').trigger('click')
    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('clears the value', async () => {
    const wrapper = mountPicker({ modelValue: '2081-01-05', clearable: true })
    await wrapper.find('.ndp-clear').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([null])
  })

  it('does not open when disabled or readonly', async () => {
    for (const props of [{ disabled: true }, { readonly: true }]) {
      const wrapper = mountPicker(props)
      await wrapper.find('input').trigger('click')
      expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    }
  })

  it('renders inline without an input', async () => {
    const wrapper = mountPicker({ inline: true, locale: 'ne' })
    expect(wrapper.find('input').exists()).toBe(false)
    expect(wrapper.find('.ndp-weekday').text()).toBe('आइत')
    await wrapper.findAll('.ndp-day:not(.ndp-day--outside)')[11]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['2081-01-12'])
  })

  it('forwards attributes to the input', () => {
    const wrapper = mountPicker({ id: 'dob', name: 'dob' })
    expect(wrapper.find('input').attributes('id')).toBe('dob')
    expect(wrapper.find('input').attributes('name')).toBe('dob')
  })
})

describe('NepaliCalendar keyboard navigation', () => {
  it('moves focus with arrows and pages months', async () => {
    const wrapper = mount(NepaliCalendar, {
      props: { modelValue: { year: 2081, month: 1, day: 5 } },
      attachTo: document.body,
    })
    const grid = wrapper.find('[role="grid"]')
    const focusedText = () => wrapper.find('[data-focused="true"]').attributes('aria-label')

    await grid.trigger('keydown', { key: 'ArrowRight' })
    expect(focusedText()).toBe('Thursday, 6 Baisakh 2081')
    await grid.trigger('keydown', { key: 'ArrowDown' })
    expect(focusedText()).toBe('Thursday, 13 Baisakh 2081')
    await grid.trigger('keydown', { key: 'Home' })
    expect(focusedText()).toBe('Sunday, 9 Baisakh 2081')
    await grid.trigger('keydown', { key: 'End' })
    expect(focusedText()).toBe('Saturday, 15 Baisakh 2081')
    await grid.trigger('keydown', { key: 'PageDown' })
    expect(focusedText()).toContain('Jestha 2081')
    await grid.trigger('keydown', { key: 'PageUp', shiftKey: true })
    expect(focusedText()).toContain('Jestha 2080')
  })

  it('selects today from the footer and switches month via select', async () => {
    const wrapper = mount(NepaliCalendar, { props: { modelValue: null } })
    await wrapper.find('.ndp-link').trigger('click')
    expect(wrapper.emitted('update:modelValue')![0]).toEqual([{ year: 2081, month: 1, day: 5 }])

    await wrapper.findAll('select')[0]!.setValue('3')
    expect(wrapper.find('[role="grid"]').attributes('aria-label')).toBe('Asar 2081')
  })
})

describe('slots and plugin', () => {
  it('forwards the day and footer slots', async () => {
    const wrapper = mount(NepaliDatePicker, {
      props: { modelValue: null },
      slots: {
        day: '<template #day="{ day }"><b class="custom">{{ day.date.day }}</b></template>',
        footer: '<span class="custom-footer">hi</span>',
      },
    })
    await wrapper.find('input').trigger('click')
    expect(wrapper.findAll('.custom').length).toBeGreaterThan(27)
    expect(wrapper.find('.custom-footer').exists()).toBe(true)
  })

  it('registers components globally', async () => {
    const { NepaliDatePickerPlugin } = await import('../src/plugin')
    const wrapper = mount(
      { template: '<NepaliDatePicker inline />' },
      {
        global: { plugins: [NepaliDatePickerPlugin] },
      },
    )
    expect(wrapper.find('[role="grid"]').exists()).toBe(true)
  })
})
