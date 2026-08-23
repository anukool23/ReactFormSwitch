# FormSwitch

Schema-driven, headless, themeable React forms. A thin rendering + theming +
serialization layer on top of [React Hook Form](https://react-hook-form.com)
(state) and [Zod](https://zod.dev) (validation) — it owns the config-to-UI part,
RHF owns the hard state part.

```bash
npm i formswitch react-hook-form zod
```

```tsx
import { FormSwitch } from 'formswitch'
import 'formswitch/styles.css'
import { z } from 'zod'

<FormSwitch
  theme="light"
  schema={{
    payload: 'json', // 'json' | 'formdata' | 'xml' | custom
    fields: [
      { name: 'name',  type: 'text',  label: 'Name',  col: { mobile: 12, desktop: 6 },
        validation: z.string().min(1) },
      { name: 'email', type: 'email', label: 'Email', col: { mobile: 12, desktop: 6 },
        validation: z.string().email() },
      { name: 'subscribe', type: 'checkbox', label: 'Subscribe' },
      { name: 'topic', type: 'text', label: 'Topic',
        showIf: (v) => v.subscribe === true }, // conditional
    ],
  }}
  onSubmit={(payload, values) => console.log(payload, values)}
/>
```

## Multi-step

Provide `steps` instead of `fields`; each step validates before advancing.

```tsx
schema={{
  steps: [
    { title: 'Account', fields: [/* ... */] },
    { title: 'Profile', fields: [/* ... */] },
  ],
}}
```

## Extending

Three plain registries — no plugin framework:

```tsx
import { registerField, registerSerializer, defineTheme } from 'formswitch'

registerField('rating', ({ value, onChange }) => /* your headless component */)
registerSerializer('csv', (values) => Object.values(values).join(','))
const brand = defineTheme({ '--fs-color-primary': '#e11d48' })
```

## Look & behavior in JSON (`ui`) — no raw CSS

Everything visual is configured through `schema.ui`. Values are plain strings
and enums anyone can write; the library maps them to CSS variables internally.

```jsonc
{
  "ui": {
    "size": "md",                 // sm | md | lg  (field padding + font)
    "maxWidth": "520px",
    "labelPosition": "top",       // top | left
    "errors": "toast",            // inline | toast | popup
    "button": {
      "position": "full",         // left | center | right | full
      "color": "#7c3aed",
      "textColor": "#ffffff"
    },
    "toast": {
      "position": "top-center",   // top/bottom + left/center/right
      "duration": 4000,
      "successMessage": "Saved!"  // success toast after a valid submit
    },
    "theme": {
      "primary": "#7c3aed",       // accent: buttons, focus rings
      "text": "#1a1a1a",
      "mutedText": "#6b7280",
      "background": "#ffffff",
      "border": "#c4b5fd",
      "error": "#dc2626",
      "radius": "10px",
      "borderWidth": "2px",
      "gap": "1rem",
      "fontSize": "1rem"
    }
  }
}
```

Colors accept any CSS color (`"#7c3aed"`, `"rebeccapurple"`, `"rgb(...)"`);
sizes accept any CSS length (`"10px"`, `"1rem"`). No stylesheet authoring —
just values. Anything not set falls back to the default theme.

## Loaders

Set `loader` on the schema; it renders on the submit button while an async
`onSubmit` is pending (the button also disables + sets `aria-busy`). Built-ins:
`spinner` · `ring` · `pulse` · `dots` · `bars` — all CSS-only, inherit
`currentColor`. Add your own with `registerLoader(name, Component)`, or use
`<Loader name="dots" />` anywhere.

```tsx
<FormSwitch schema={{ fields: [...], loader: 'dots' }}
  onSubmit={async (p) => { await api.post(p) }} />
```

## Built-in field types

`text` · `email` · `password` · `number` · `date` · `textarea` · `select` ·
`checkbox` · `radio` · `image`

### Image upload (`type: "image"`)

Drag-and-drop, click-to-browse, and paste — with thumbnail previews and
per-file constraints, all from JSON:

```json
{
  "name": "gallery",
  "type": "image",
  "label": "Photos",
  "accept": ["image/png", "image/jpeg"],
  "maxFiles": 4,
  "maxSizeMB": 2,
  "required": true
}
```

The field value is real `File` objects, so serialization does the right thing
per payload:

| Payload | Image becomes |
|---|---|
| `formdata` | native multipart file(s) — what servers expect for uploads |
| `json` | base64 data-URL string(s) |
| `xml` | base64 data-URL element(s) |

Because files are read for `json`/`xml`, **`serialize()` (and `onSubmit`) are
async** — `await` them. Note base64 inflates payloads ~33%; prefer `formdata`
for real uploads.

## Responsive

Column spans (`col`) map to a 12-col CSS grid driven by **container queries**
(`mobile` < 640px ≤ `tablet` < 1024px ≤ `desktop`) — no JS media queries, no
separate mobile/desktop render paths.

## Theming

Every visual is a `--fs-*` CSS variable. Pass `theme="light" | "dark"`, a token
object, or override the variables in your own CSS.

## Validation in JSON (`rules`)

Instead of a Zod validator, a field can declare `rules` — pure JSON, with a
**custom error message** per field:

```json
{
  "name": "age",
  "type": "number",
  "label": "Age",
  "rules": { "required": true, "min": 18, "max": 99, "message": "Enter an age 18–99" }
}
```

Supported: `required`, `email`, `pattern` (regex string), `minLength`,
`maxLength`, `min`/`max` (numbers), and `message` (overrides the default text
for any failed rule). A Zod `validation` still wins when both are present.

## Builder website (no JSON by hand)

A visual builder configures **everything** — theme colors, radius/border, size,
label & button position, error mode, toast position + TTL, per-field validation
and custom messages, options, image constraints, multi-step — then gives you the
JSON to copy straight into `<FormSwitch schema={...} />`.

```bash
npm run playground   # opens the builder at /web/
```

## Scripts

- `npm run dev` — feature playground (`/`)
- `npm run playground` — visual builder (`/web/`)
- `npm test` — Vitest suite
- `npm run build` — library build (ESM + CJS + `.d.ts` + CSS)
