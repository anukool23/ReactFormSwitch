import { describe, expect, it } from 'vitest'
import { registerSerializer, serialize } from '../registry/serializers'

describe('serializers', () => {
  const values = { name: 'Ada', age: 36 }

  it('json returns the object as-is', async () => {
    expect(await serialize(values, 'json')).toEqual(values)
  })

  it('json is the default format', async () => {
    expect(await serialize(values)).toEqual(values)
  })

  it('formdata produces a FormData with string entries', async () => {
    const fd = (await serialize(values, 'formdata')) as FormData
    expect(fd).toBeInstanceOf(FormData)
    expect(fd.get('name')).toBe('Ada')
    expect(fd.get('age')).toBe('36')
  })

  it('xml escapes special characters', async () => {
    const xml = (await serialize({ note: 'a<b & "c"' }, 'xml')) as string
    expect(xml).toContain('<note>a&lt;b &amp; &quot;c&quot;</note>')
    expect(xml).toContain('<form>')
  })

  it('throws on unknown format', async () => {
    await expect(serialize(values, 'yaml')).rejects.toThrow(/unknown payload format/)
  })

  it('supports custom serializers', async () => {
    registerSerializer('csv', (v) => Object.values(v).join(','))
    expect(await serialize(values, 'csv')).toBe('Ada,36')
  })

  describe('image / File values', () => {
    const file = new File(['hello'], 'a.png', { type: 'image/png' })

    it('json encodes Files (and arrays) to base64 data URLs', async () => {
      const out = (await serialize({ photos: [file] }, 'json')) as { photos: string[] }
      expect(out.photos[0]).toMatch(/^data:image\/png;base64,/)
    })

    it('formdata appends each File natively (multipart)', async () => {
      const fd = (await serialize({ photos: [file, file] }, 'formdata')) as FormData
      const entries = fd.getAll('photos')
      expect(entries).toHaveLength(2)
      expect(entries[0]).toBeInstanceOf(File)
    })

    it('xml encodes a File to a base64 element', async () => {
      const xml = (await serialize({ photos: [file] }, 'xml')) as string
      expect(xml).toContain('<photos>data:image/png;base64,')
    })
  })
})
