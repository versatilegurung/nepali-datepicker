// Vite library entry: pulls in the stylesheet (emitted as dist/style.css) and
// re-exports the public API. Kept out of the type build so the published
// .d.ts files don't reference CSS.
import './styles/datepicker.css'

export * from './index'
