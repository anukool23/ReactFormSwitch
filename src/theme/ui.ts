import type { CSSProperties } from 'react'
import type { FieldSize, UIConfig } from '../schema/types'

const themeVars: Record<string, string> = {
  primary: '--fs-color-primary',
  primaryText: '--fs-color-primary-text',
  text: '--fs-color-text',
  mutedText: '--fs-color-muted',
  background: '--fs-color-bg',
  border: '--fs-color-border',
  error: '--fs-color-error',
  radius: '--fs-radius',
  borderWidth: '--fs-border-width',
  gap: '--fs-gap',
  fontSize: '--fs-font-size',
}

// Padding is em-based (see styles.css), so size only needs to set font size.
const sizes: Record<FieldSize, Record<string, string>> = {
  sm: { '--fs-font-size': '0.875rem' },
  md: { '--fs-font-size': '1rem' },
  lg: { '--fs-font-size': '1.125rem' },
}

/** Named field-size scale → font size. Falls back to the value as a CSS length. */
export const SIZE_FONT: Record<string, string> = {
  xs: '0.75rem',
  sm: '0.875rem',
  md: '1rem',
  lg: '1.125rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  '3xl': '1.875rem',
  '4xl': '2.25rem',
}

export function sizeFont(size?: string): string | undefined {
  if (!size) return undefined
  return SIZE_FONT[size] ?? size
}

/** Translate a JSON `ui` config into CSS-variable inline styles. */
export function uiToStyle(ui: UIConfig): CSSProperties {
  const s: Record<string, string> = {}
  if (ui.size) Object.assign(s, sizes[ui.size])
  if (ui.theme) {
    for (const [k, v] of Object.entries(ui.theme)) {
      const cssVar = themeVars[k]
      if (cssVar && v) s[cssVar] = v
    }
  }
  if (ui.button?.color) s['--fs-btn-bg'] = ui.button.color
  if (ui.button?.textColor) s['--fs-btn-text'] = ui.button.textColor
  if (ui.maxWidth) s.maxWidth = ui.maxWidth
  return s as CSSProperties
}
