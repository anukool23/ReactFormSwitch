import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { GridLayout } from './GridLayout'
import { SubmitButton } from '../SubmitButton'
import type { StepSpec, Values } from '../schema/types'

export function StepLayout({
  steps,
  submitLabel = 'Submit',
  loader,
}: {
  steps: StepSpec[]
  submitLabel?: string
  loader?: string
}) {
  const [i, setI] = useState(0)
  const { trigger } = useFormContext<Values>()
  const step = steps[i]
  const isLast = i === steps.length - 1

  const next = async () => {
    const names = step.fields.map((f) => f.name)
    if (await trigger(names)) setI((n) => n + 1)
  }

  return (
    <div className="fs-steps">
      <div className="fs-step-progress" aria-label={`Step ${i + 1} of ${steps.length}`}>
        {steps.map((s, idx) => (
          <span
            key={idx}
            className="fs-step-dot"
            data-active={idx === i}
            data-done={idx < i}
            title={s.title}
          />
        ))}
      </div>
      {step.title && <h3 className="fs-step-title">{step.title}</h3>}
      <GridLayout fields={step.fields} />
      <div className="fs-step-nav">
        {i > 0 && (
          <button type="button" className="fs-btn fs-btn-secondary" onClick={() => setI((n) => n - 1)}>
            Back
          </button>
        )}
        {!isLast && (
          <button type="button" className="fs-btn" onClick={next}>
            Next
          </button>
        )}
        {isLast && <SubmitButton label={submitLabel} loader={loader} />}
      </div>
    </div>
  )
}
