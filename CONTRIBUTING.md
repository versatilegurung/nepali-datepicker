# Contributing

## Setup

Requires Node ≥ 22 and pnpm (`npm i -g pnpm`; the version is pinned in `package.json`).

```sh
pnpm install
pnpm --filter playground dev   # manual testing with hot reload
pnpm test:watch                # run inside packages/datepicker
```

Before pushing, run the same checks as CI:

```sh
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm check:package
```

## Project layout

```
packages/datepicker/src/
  core/          framework-agnostic: calendar data, BS⇄AD conversion, formatting, locales
  composables/   useNepaliCalendar: headless month-grid state
  components/    NepaliCalendar (grid) and NepaliDatePicker (input + popover)
  styles/        datepicker.css (CSS-variable theme)
  index.ts       the public API; anything not exported here is internal
```

Keep `core/` free of Vue imports so it can back other frameworks later.

## Versioning & releases

We use [Changesets](https://github.com/changesets/changesets) and semver:

1. In your PR, run `pnpm changeset` and choose:
   - **patch**: bug fix, calendar data correction
   - **minor**: new prop, slot, export or locale
   - **major**: removed or renamed exports/props, changed `v-model` shape, changed CSS class names or variables
2. When it merges to `main`, the Release workflow opens a "Version Packages" PR.
3. Merging that PR publishes to npm (with provenance) and updates `CHANGELOG.md`.

Repo secrets needed: `NPM_TOKEN` (an npm automation token), or configure npm trusted publishing.

## Updating calendar data

The BS calendar is set yearly by the Nepal Panchang Nirnayak Bikas Samiti. A scheduled
workflow opens an issue every January as a reminder.

1. Get the official calendar for the year (month lengths for Baisakh–Chaitra).
2. Edit the year's row in `packages/datepicker/src/core/calendar-data.ts`.
3. Bump `BS_LAST_VERIFIED_YEAR` and update the provenance comment.
4. Add that year's Baisakh 1 ⇄ AD pair to `tests/convert.test.ts` ("known BS ⇄ AD pairs").
5. `pnpm test` (the round-trip test covers the whole range), then add a **patch** changeset.

To extend the range past 2090, append rows; `BS_END_YEAR` is derived automatically.
