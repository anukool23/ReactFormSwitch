import { useFormContext } from 'react-hook-form'
import { Loader } from './registry/loaders'

export function SubmitButton({ label = 'Submit', loader }: { label?: string; loader?: string }) {
  const {
    formState: { isSubmitting },
  } = useFormContext()
  return (
    <button type="submit" className="fs-btn" disabled={isSubmitting} aria-busy={isSubmitting}>
      {isSubmitting ? <Loader name={loader} /> : label}
    </button>
  )
}
