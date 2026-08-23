import type { ComponentType } from 'react'
import type { ZodTypeAny } from 'zod'

export type Values = Record<string, unknown>

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

/** Column span (out of 12). A number applies to all breakpoints. */
export type ColSpan = number | Partial<Record<Breakpoint, number>>

export interface Option {
  label: string
  value: string
}

/** JSON-authored validation. `message` overrides the default text for this field. */
export interface FieldRules {
  required?: boolean
  email?: boolean
  /** Regex source string, e.g. "^[0-9]+$". */
  pattern?: string
  minLength?: number
  maxLength?: number
  /** Numeric bounds (number fields). */
  min?: number
  max?: number
  /** Custom error message shown for any failed rule on this field. */
  message?: string
}

export interface FieldSpec {
  /** Unique key; becomes the form value key. */
  name: string
  /** Field registry key (e.g. "text", "select"). */
  type: string
  label?: string
  placeholder?: string
  /** Field size: a preset (xs…4xl) or any CSS length (e.g. "18px", "1.2em"). */
  size?: string
  /** For select / radio. */
  options?: Option[]
  /** Zod validator. Takes precedence over `rules`. */
  validation?: ZodTypeAny
  /** JSON validation (no code). Used when `validation` is absent. */
  rules?: FieldRules
  defaultValue?: unknown
  col?: ColSpan
  /** Render + validate this field only when the predicate holds. */
  showIf?: (values: Values) => boolean

  /* ---- image field options (type: "image") ---- */
  /** Allowed MIME types, e.g. ["image/png", "image/*"]. */
  accept?: string[]
  /** Max size per file, in megabytes. */
  maxSizeMB?: number
  /** Max number of files. Omit or 1 for a single image. */
  maxFiles?: number
  /** Require at least one file (image fields). */
  required?: boolean
}

export interface StepSpec {
  title?: string
  fields: FieldSpec[]
}

export type PayloadFormat = 'json' | 'formdata' | 'xml' | (string & {})

/* ---- JSON-authored UX config (no raw CSS) ---- */

export interface UITheme {
  /** Accent color: buttons, focus rings. */
  primary?: string
  primaryText?: string
  text?: string
  mutedText?: string
  background?: string
  border?: string
  error?: string
  /** Corner rounding, e.g. "8px" or "0". */
  radius?: string
  /** Field border thickness, e.g. "1px" or "2px". */
  borderWidth?: string
  /** Space between fields, e.g. "1rem". */
  gap?: string
  /** Base font size, e.g. "1rem". */
  fontSize?: string
}

export type FieldSize = 'sm' | 'md' | 'lg'
export type LabelPosition = 'top' | 'left'
export type ButtonPosition = 'left' | 'center' | 'right' | 'full'
export type ErrorDisplay = 'inline' | 'toast' | 'popup'
export type ToastPosition =
  | 'top-right'
  | 'top-center'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'

export interface UIButton {
  position?: ButtonPosition
  /** Overrides theme.primary for the submit button only. */
  color?: string
  textColor?: string
}

export interface UIToast {
  position?: ToastPosition
  /** Auto-dismiss after N ms (default 4000). */
  duration?: number
  /** Shown as a success toast after a successful submit. */
  successMessage?: string
}

export interface UIConfig {
  theme?: UITheme
  size?: FieldSize
  /** Max form width, e.g. "640px". */
  maxWidth?: string
  /** Label above the field ("top") or beside it ("left"). */
  labelPosition?: LabelPosition
  button?: UIButton
  /** How validation errors surface. */
  errors?: ErrorDisplay
  toast?: UIToast
}

export interface FormSchema {
  /** Single-page form. Mutually exclusive with `steps`. */
  fields?: FieldSpec[]
  /** Multi-step form. Presence switches on the step UI. */
  steps?: StepSpec[]
  payload?: PayloadFormat
  submitLabel?: string
  /** Loader shown on the submit button while onSubmit is pending. */
  loader?: string
  /** JSON-authored look & behavior. No raw CSS required. */
  ui?: UIConfig
}

/** Props every registered field component receives. Headless & controlled. */
export interface FieldProps {
  spec: FieldSpec
  id: string
  value: unknown
  onChange: (value: unknown) => void
  onBlur: () => void
  error?: string
}

export type FieldComponent = ComponentType<FieldProps>

/** Theme is a set of CSS-variable overrides applied to the form root. */
export type ThemeTokens = Record<`--fs-${string}`, string>
