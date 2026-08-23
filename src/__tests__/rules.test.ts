import { describe, expect, it } from 'vitest'
import { makeResolver } from '../schema/resolver'
import type { FieldSpec } from '../schema/types'

const run = (fields: FieldSpec[], values: Record<string, unknown>) =>
  makeResolver(fields)(values, {}, { shouldUseNativeValidation: false, fields: {} } as never)

const err = (r: Awaited<ReturnType<typeof run>>, name: string) =>
  (r.errors as Record<string, { message: string }>)[name]?.message

describe('JSON rules validation', () => {
  it('required with a custom message', async () => {
    const r = await run(
      [{ name: 'name', type: 'text', rules: { required: true, message: 'Name is mandatory' } }],
      { name: '' },
    )
    expect(err(r, 'name')).toBe('Name is mandatory')
  })

  it('email + default message', async () => {
    const r = await run([{ name: 'e', type: 'email', rules: { required: true, email: true } }], { e: 'nope' })
    expect(err(r, 'e')).toBe('Invalid email')
  })

  it('minLength / maxLength', async () => {
    const f: FieldSpec[] = [{ name: 'u', type: 'text', rules: { minLength: 3, maxLength: 5 } }]
    expect(err(await run(f, { u: 'ab' }), 'u')).toMatch(/at least 3/)
    expect(err(await run(f, { u: 'abcdef' }), 'u')).toMatch(/at most 5/)
    expect((await run(f, { u: 'abcd' })).errors).toEqual({})
  })

  it('optional string lets empty through but validates non-empty', async () => {
    const f: FieldSpec[] = [{ name: 'u', type: 'text', rules: { minLength: 3 } }]
    expect((await run(f, { u: '' })).errors).toEqual({})
    expect(err(await run(f, { u: 'ab' }), 'u')).toMatch(/at least 3/)
  })

  it('number min/max with coercion', async () => {
    const f: FieldSpec[] = [{ name: 'age', type: 'number', rules: { required: true, min: 18, max: 99 } }]
    expect(err(await run(f, { age: '' }), 'age')).toBe('Required')
    expect(err(await run(f, { age: 10 }), 'age')).toMatch(/≥ 18/)
    expect((await run(f, { age: 30 })).errors).toEqual({})
  })

  it('checkbox required must be true', async () => {
    const f: FieldSpec[] = [{ name: 'tos', type: 'checkbox', rules: { required: true, message: 'Accept it' } }]
    expect(err(await run(f, { tos: false }), 'tos')).toBe('Accept it')
    expect((await run(f, { tos: true })).errors).toEqual({})
  })

  it('pattern', async () => {
    const f: FieldSpec[] = [{ name: 'zip', type: 'text', rules: { pattern: '^[0-9]{5}$', message: 'Bad zip' } }]
    expect(err(await run(f, { zip: 'abc' }), 'zip')).toBe('Bad zip')
    expect((await run(f, { zip: '12345' })).errors).toEqual({})
  })
})
