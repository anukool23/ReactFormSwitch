import { FieldRenderer } from '../FieldRenderer'
import type { FieldSpec } from '../schema/types'

export function GridLayout({ fields }: { fields: FieldSpec[] }) {
  return (
    <div className="fs-grid">
      {fields.map((f) => (
        <FieldRenderer key={f.name} spec={f} />
      ))}
    </div>
  )
}
