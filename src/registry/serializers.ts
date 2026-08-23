import type { PayloadFormat, Values } from '../schema/types'

export type Serializer = (values: Values) => unknown | Promise<unknown>

const serializers = new Map<string, Serializer>()

function xmlEscape(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]!),
  )
}

function toDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result as string)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

/** Recursively encode Files (and arrays of them) to base64 data-URLs. */
async function encode(val: unknown): Promise<unknown> {
  if (val instanceof Blob) return toDataURL(val)
  if (Array.isArray(val)) return Promise.all(val.map(encode))
  return val
}

async function toXml(values: Values, root = 'form'): Promise<string> {
  const cell = async (v: unknown) =>
    v instanceof Blob ? xmlEscape(await toDataURL(v)) : xmlEscape(v == null ? '' : String(v))
  const parts: string[] = []
  for (const [k, v] of Object.entries(values)) {
    if (Array.isArray(v)) for (const item of v) parts.push(`<${k}>${await cell(item)}</${k}>`)
    else parts.push(`<${k}>${await cell(v)}</${k}>`)
  }
  return `<?xml version="1.0" encoding="UTF-8"?><${root}>${parts.join('')}</${root}>`
}

serializers.set('json', async (v) => {
  const out: Values = {}
  for (const [k, val] of Object.entries(v)) out[k] = await encode(val)
  return out
})

serializers.set('formdata', (v) => {
  const fd = new FormData()
  const append = (k: string, item: unknown) =>
    item instanceof Blob ? fd.append(k, item) : fd.append(k, item == null ? '' : String(item))
  for (const [k, val] of Object.entries(v)) {
    if (Array.isArray(val)) val.forEach((item) => append(k, item))
    else append(k, val)
  }
  return fd
})

serializers.set('xml', (v) => toXml(v))

export function registerSerializer(format: string, fn: Serializer): void {
  serializers.set(format, fn)
}

export async function serialize(values: Values, format: PayloadFormat = 'json'): Promise<unknown> {
  const fn = serializers.get(format)
  if (!fn) throw new Error(`FormSwitch: unknown payload format "${format}"`)
  return fn(values)
}
