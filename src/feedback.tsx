import type { ToastPosition } from './schema/types'

export interface ToastItem {
  id: number
  type: 'success' | 'error'
  message: string
}

export function Toasts({
  items,
  position = 'top-right',
  onDismiss,
}: {
  items: ToastItem[]
  position?: ToastPosition
  onDismiss: (id: number) => void
}) {
  if (!items.length) return null
  return (
    <div className="fs-toasts" data-pos={position}>
      {items.map((t) => (
        <div
          key={t.id}
          className={`fs-toast fs-toast-${t.type}`}
          role="status"
          onClick={() => onDismiss(t.id)}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function ErrorPopup({ errors, onClose }: { errors: string[]; onClose: () => void }) {
  if (!errors.length) return null
  return (
    <div className="fs-popup-backdrop" onClick={onClose}>
      <div
        className="fs-popup"
        role="alertdialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="fs-popup-title">Please fix the following</h4>
        <ul className="fs-popup-list">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
        <button type="button" className="fs-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  )
}
