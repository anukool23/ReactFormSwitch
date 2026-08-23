import { useCallback, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form'
import { GridLayout } from './layout/GridLayout'
import { StepLayout } from './layout/StepLayout'
import { SubmitButton } from './SubmitButton'
import { ErrorPopup, Toasts, type ToastItem } from './feedback'
import { serialize } from './registry/serializers'
import { buildDefaults, makeResolver, visibleFields } from './schema/resolver'
import { themeStyle, type ThemeInput } from './theme/themes'
import { uiToStyle } from './theme/ui'
import type { FieldSpec, FormSchema, Values } from './schema/types'
import './theme/styles.css'

export interface FormSwitchProps {
  schema: FormSchema
  /** Legacy theme prop; `schema.ui.theme` supersedes it. */
  theme?: ThemeInput
  className?: string
  /** Receives the serialized payload and the raw (visible-only) values. */
  onSubmit: (payload: unknown, values: Values) => void | Promise<void>
}

function allFields(schema: FormSchema): FieldSpec[] {
  return schema.steps ? schema.steps.flatMap((s) => s.fields) : schema.fields ?? []
}

export function FormSwitch({ schema, theme, className, onSubmit }: FormSwitchProps) {
  const fields = useMemo(() => allFields(schema), [schema])
  const methods = useForm<Values>({
    defaultValues: useMemo(() => buildDefaults(fields), [fields]),
    resolver: useMemo(() => makeResolver(fields), [fields]),
    mode: 'onBlur',
  })

  const ui = schema.ui ?? {}
  const errorsMode = ui.errors ?? 'inline'
  const labelFor = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.name, f.label ?? f.name])),
    [fields],
  )

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [popupErrors, setPopupErrors] = useState<string[]>([])
  const toastId = useRef(0)

  const pushToast = useCallback(
    (type: ToastItem['type'], message: string) => {
      const id = ++toastId.current
      setToasts((t) => [...t, { id, type, message }])
      const dur = ui.toast?.duration ?? 4000
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), dur)
    },
    [ui.toast?.duration],
  )

  const errorMessages = (errs: FieldErrors<Values>): string[] =>
    Object.entries(errs).map(([name, e]) => `${labelFor[name] ?? name}: ${e?.message ?? 'Invalid'}`)

  const submit = methods.handleSubmit(
    async (values) => {
      const cleaned: Values = {}
      for (const f of visibleFields(fields, values)) cleaned[f.name] = values[f.name]
      await onSubmit(await serialize(cleaned, schema.payload), cleaned)
      if (ui.toast?.successMessage) pushToast('success', ui.toast.successMessage)
    },
    (errs) => {
      const list = errorMessages(errs)
      if (errorsMode === 'toast') list.forEach((m) => pushToast('error', m))
      else if (errorsMode === 'popup') setPopupErrors(list)
    },
  )

  const rootStyle = { ...themeStyle(theme), ...uiToStyle(ui) }
  const rootClass = className ? `fs-root ${className}` : 'fs-root'

  return (
    <FormProvider {...methods}>
      <form
        className={rootClass}
        style={rootStyle}
        data-label={ui.labelPosition ?? 'top'}
        data-btn={ui.button?.position ?? 'left'}
        data-errors={errorsMode}
        onSubmit={submit}
        noValidate
      >
        {schema.steps ? (
          <StepLayout steps={schema.steps} submitLabel={schema.submitLabel} loader={schema.loader} />
        ) : (
          <>
            <GridLayout fields={schema.fields ?? []} />
            <SubmitButton label={schema.submitLabel} loader={schema.loader} />
          </>
        )}
        <Toasts items={toasts} position={ui.toast?.position} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
        <ErrorPopup errors={popupErrors} onClose={() => setPopupErrors([])} />
      </form>
    </FormProvider>
  )
}
