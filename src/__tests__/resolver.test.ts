import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { buildDefaults, makeResolver, visibleFields } from '../schema/resolver'
import type { FieldSpec } from '../schema/types'

const fields: FieldSpec[] = [
  { name: 'email', type: 'email', validation: z.string().email() },
  { name: 'newsletter', type: 'checkbox' },
  {
    name: 'freq',
    type: 'select',
    validation: z.string().min(1, 'required'),
    showIf: (v) => v.newsletter === true,
  },
]

const run = (values: Record<string, unknown>) =>
  makeResolver(fields)(values, {}, { shouldUseNativeValidation: false, fields: {} } as never)

describe('resolver', () => {
  it('buildDefaults seeds empty strings and false checkboxes', () => {
    expect(buildDefaults(fields)).toEqual({ email: '', newsletter: false, freq: '' })
  })

  it('passes valid input', async () => {
    const r = await run({ email: 'a@b.com', newsletter: false, freq: '' })
    expect(r.errors).toEqual({})
  })

  it('reports invalid email', async () => {
    const r = await run({ email: 'nope', newsletter: false, freq: '' })
    expect((r.errors as Record<string, { message: string }>).email.message).toMatch(/email/i)
  })

  it('skips validation for hidden conditional fields', async () => {
    // freq is required but hidden while newsletter is false
    const r = await run({ email: 'a@b.com', newsletter: false, freq: '' })
    expect(r.errors).toEqual({})
  })

  it('validates conditional field once visible', async () => {
    const r = await run({ email: 'a@b.com', newsletter: true, freq: '' })
    expect((r.errors as Record<string, { message: string }>).freq.message).toBe('required')
  })

  it('visibleFields honors showIf', () => {
    expect(visibleFields(fields, { newsletter: false }).map((f) => f.name)).toEqual([
      'email',
      'newsletter',
    ])
    expect(visibleFields(fields, { newsletter: true }).map((f) => f.name)).toEqual([
      'email',
      'newsletter',
      'freq',
    ])
  })
})
