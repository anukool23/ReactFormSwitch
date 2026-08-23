import { useEffect, useMemo, useRef, useState } from 'react'
import type { FieldComponent, FieldProps } from '../schema/types'

const registry = new Map<string, FieldComponent>()

export function registerField(type: string, component: FieldComponent): void {
  registry.set(type, component)
}

export function getField(type: string): FieldComponent {
  const c = registry.get(type)
  if (!c) throw new Error(`FormSwitch: no field registered for type "${type}"`)
  return c
}

export function hasField(type: string): boolean {
  return registry.has(type)
}

/* ---- built-in fields (headless, controlled) ---- */

const str = (v: unknown) => (v == null ? '' : String(v))

function Input(type: string) {
  const Comp = ({ spec, id, value, onChange, onBlur, error }: FieldProps) => (
    <input
      id={id}
      name={spec.name}
      type={type}
      className="fs-input"
      placeholder={spec.placeholder}
      aria-invalid={!!error}
      value={str(value)}
      onChange={(e) =>
        onChange(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)
      }
      onBlur={onBlur}
    />
  )
  Comp.displayName = `FS_${type}`
  return Comp
}

const Textarea = ({ spec, id, value, onChange, onBlur, error }: FieldProps) => (
  <textarea
    id={id}
    name={spec.name}
    className="fs-input fs-textarea"
    placeholder={spec.placeholder}
    aria-invalid={!!error}
    value={str(value)}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
  />
)

const Select = ({ spec, id, value, onChange, onBlur, error }: FieldProps) => (
  <select
    id={id}
    name={spec.name}
    className="fs-input fs-select"
    aria-invalid={!!error}
    value={str(value)}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
  >
    <option value="" disabled={!!spec.placeholder}>
      {spec.placeholder ?? ''}
    </option>
    {(spec.options ?? []).map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
)

const Checkbox = ({ spec, id, value, onChange, onBlur, error }: FieldProps) => (
  <input
    id={id}
    name={spec.name}
    type="checkbox"
    className="fs-checkbox"
    aria-invalid={!!error}
    checked={!!value}
    onChange={(e) => onChange(e.target.checked)}
    onBlur={onBlur}
  />
)

const Radio = ({ spec, id, value, onChange, onBlur }: FieldProps) => (
  <div className="fs-radio-group" role="radiogroup" id={id}>
    {(spec.options ?? []).map((o) => (
      <label key={o.value} className="fs-radio">
        <input
          type="radio"
          name={spec.name}
          value={o.value}
          checked={str(value) === o.value}
          onChange={() => onChange(o.value)}
          onBlur={onBlur}
        />
        {o.label}
      </label>
    ))}
  </div>
)

function acceptMatch(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true
  return accept.some((a) => (a.endsWith('/*') ? file.type.startsWith(a.slice(0, -1)) : file.type === a))
}

function Thumb({ file, onRemove }: { file: File; onRemove: () => void }) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  useEffect(() => () => URL.revokeObjectURL(url), [url])
  return (
    <div className="fs-thumb">
      <img className="fs-thumb-img" src={url} alt={file.name} />
      <button type="button" className="fs-thumb-remove" aria-label={`Remove ${file.name}`} onClick={onRemove}>
        ×
      </button>
    </div>
  )
}

const ImageField = ({ spec, id, value, onChange, onBlur, error }: FieldProps) => {
  const files = (value as File[]) ?? []
  const maxFiles = spec.maxFiles ?? Infinity
  const [drag, setDrag] = useState(false)
  const [msg, setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const add = (incoming: File[]) => {
    const next = [...files]
    const errs: string[] = []
    for (const f of incoming) {
      if (!acceptMatch(f, spec.accept)) errs.push(`${f.name}: type not allowed`)
      else if (spec.maxSizeMB && f.size > spec.maxSizeMB * 1024 * 1024)
        errs.push(`${f.name}: over ${spec.maxSizeMB}MB`)
      else if (next.length >= maxFiles) {
        errs.push(`Max ${maxFiles} file(s)`)
        break
      } else next.push(f)
    }
    setMsg(errs.join(' · '))
    onChange(next)
    onBlur()
  }

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))

  const single = maxFiles === 1

  return (
    <div>
      <div
        className="fs-dropzone"
        data-drag={drag}
        role="button"
        tabIndex={0}
        aria-invalid={!!error}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDrag(true)
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDrag(false)
          add(Array.from(e.dataTransfer.files))
        }}
        onPaste={(e) => {
          const imgs = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'))
          if (imgs.length) add(imgs)
        }}
      >
        <span className="fs-dropzone-text">
          {single ? 'Drag an image here, or click to browse' : 'Drag images here, or click to browse'}
        </span>
        <input
          ref={inputRef}
          id={id}
          name={spec.name}
          type="file"
          className="fs-file-input"
          accept={spec.accept?.join(',')}
          multiple={!single}
          onChange={(e) => {
            add(Array.from(e.target.files ?? []))
            e.target.value = ''
          }}
        />
      </div>
      {files.length > 0 && (
        <div className="fs-thumbs">
          {files.map((f, i) => (
            <Thumb key={`${f.name}-${i}`} file={f} onRemove={() => remove(i)} />
          ))}
        </div>
      )}
      {msg && <span className="fs-error">{msg}</span>}
    </div>
  )
}

registerField('image', ImageField)
registerField('text', Input('text'))
registerField('email', Input('email'))
registerField('password', Input('password'))
registerField('number', Input('number'))
registerField('date', Input('date'))
registerField('textarea', Textarea)
registerField('select', Select)
registerField('checkbox', Checkbox)
registerField('radio', Radio)
