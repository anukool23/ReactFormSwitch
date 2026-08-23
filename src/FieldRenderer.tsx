import type { CSSProperties } from 'react'
import { useController, useFormContext, useWatch } from 'react-hook-form'
import { getField } from './registry/fields'
import { sizeFont } from './theme/ui'
import type { FieldSpec, Values } from './schema/types'

function fieldStyle(spec: FieldSpec): CSSProperties {
  const vars: Record<string, string> = {}
  const col = spec.col
  if (typeof col === 'number') {
    vars['--fs-col-mobile'] = String(col)
  } else if (col) {
    if (col.mobile) vars['--fs-col-mobile'] = String(col.mobile)
    if (col.tablet) vars['--fs-col-tablet'] = String(col.tablet)
    if (col.desktop) vars['--fs-col-desktop'] = String(col.desktop)
  }
  const font = sizeFont(spec.size)
  if (font) vars.fontSize = font
  return vars as CSSProperties
}

export function FieldRenderer({ spec }: { spec: FieldSpec }) {
  const { control } = useFormContext<Values>()
  // ponytail: watches all values so showIf re-evaluates; re-renders this field
  // on any change. Scope the watch to referenced fields only if it shows up in profiling.
  const values = useWatch({ control }) as Values
  const { field, fieldState } = useController({ name: spec.name, control })

  if (spec.showIf && !spec.showIf(values)) return null

  const Comp = getField(spec.type)
  const isCheckbox = spec.type === 'checkbox'
  const error = fieldState.error?.message

  return (
    <div className="fs-field" style={fieldStyle(spec)} data-type={spec.type}>
      {spec.label && !isCheckbox && (
        <label className="fs-label" htmlFor={spec.name}>
          {spec.label}
        </label>
      )}
      {isCheckbox ? (
        <label className="fs-label fs-label-inline" htmlFor={spec.name}>
          <Comp
            spec={spec}
            id={spec.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            error={error}
          />
          {spec.label}
        </label>
      ) : (
        <Comp
          spec={spec}
          id={spec.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          error={error}
        />
      )}
      {error && (
        <span className="fs-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
