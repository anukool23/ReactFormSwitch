import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import type { FieldSpec, Values } from './types'

/** Fields visible for the given values (respects `showIf`). */
export function visibleFields(fields: FieldSpec[], values: Values): FieldSpec[] {
  return fields.filter((f) => !f.showIf || f.showIf(values))
}

function defaultFor(f: FieldSpec): unknown {
  if (f.defaultValue !== undefined) return f.defaultValue
  if (f.type === 'checkbox') return false
  if (f.type === 'image') return []
  return ''
}

export function buildDefaults(fields: FieldSpec[]): Values {
  const out: Values = {}
  for (const f of fields) out[f.name] = defaultFor(f)
  return out
}

/** Build a Zod validator for an image field from its JSON options. */
function imageValidator(f: FieldSpec): z.ZodTypeAny {
  // Array methods (min/max) must precede refine, which returns a ZodEffects.
  let arr = z.array(z.instanceof(File))
  if (f.maxFiles) arr = arr.max(f.maxFiles, `At most ${f.maxFiles} file(s)`)
  if (f.required) arr = arr.min(1, 'Required')
  if (f.maxSizeMB) {
    const bytes = f.maxSizeMB * 1024 * 1024
    return arr.refine(
      (a) => a.every((file) => file.size <= bytes),
      `Each file must be ≤ ${f.maxSizeMB}MB`,
    )
  }
  return arr
}

/** Build a Zod validator from JSON `rules` (with optional custom message). */
function rulesValidator(f: FieldSpec): z.ZodTypeAny | undefined {
  const r = f.rules
  if (!r) return undefined
  const m = r.message

  if (f.type === 'checkbox') {
    return r.required ? z.literal(true, { errorMap: () => ({ message: m ?? 'Required' }) }) : undefined
  }

  if (f.type === 'number') {
    let n = z.number({ required_error: m ?? 'Required', invalid_type_error: m ?? 'Must be a number' })
    if (typeof r.min === 'number') n = n.min(r.min, m ?? `Must be ≥ ${r.min}`)
    if (typeof r.max === 'number') n = n.max(r.max, m ?? `Must be ≤ ${r.max}`)
    const inner = r.required ? n : n.optional()
    return z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), inner)
  }

  let s = z.string()
  if (r.required) s = s.min(1, m ?? 'Required')
  if (r.email) s = s.email(m ?? 'Invalid email')
  if (r.pattern) s = s.regex(new RegExp(r.pattern), m ?? 'Invalid format')
  if (typeof r.minLength === 'number') s = s.min(r.minLength, m ?? `Must be at least ${r.minLength} characters`)
  if (typeof r.maxLength === 'number') s = s.max(r.maxLength, m ?? `Must be at most ${r.maxLength} characters`)
  // When not required, allow an empty string through.
  return r.required ? s : z.union([z.literal(''), s])
}

function validatorFor(f: FieldSpec): z.ZodTypeAny | undefined {
  if (f.validation) return f.validation
  if (f.type === 'image') return imageValidator(f)
  return rulesValidator(f)
}

/**
 * Custom RHF resolver: validates only currently-visible fields against their
 * Zod validators, rebuilt per call so `showIf` conditionals are respected.
 * Avoids the @hookform/resolvers dep since our shape is flat.
 */
export function makeResolver(fields: FieldSpec[]): Resolver<Values> {
  return async (values) => {
    const shape: Record<string, z.ZodTypeAny> = {}
    for (const f of visibleFields(fields, values)) {
      const v = validatorFor(f)
      if (v) shape[f.name] = v
    }
    const result = z.object(shape).safeParse(values)
    if (result.success) return { values, errors: {} }

    const errors: Record<string, { type: string; message: string }> = {}
    for (const issue of result.error.issues) {
      const key = String(issue.path[0])
      if (key && !errors[key]) errors[key] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as never }
  }
}
