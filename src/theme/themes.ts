import type { CSSProperties } from 'react'
import type { ThemeTokens } from '../schema/types'

export const light: ThemeTokens = {
  '--fs-color-text': '#1a1a1a',
  '--fs-color-muted': '#6b7280',
  '--fs-color-border': '#d1d5db',
  '--fs-color-bg': '#ffffff',
  '--fs-color-primary': '#2563eb',
  '--fs-color-primary-text': '#ffffff',
  '--fs-color-error': '#dc2626',
  '--fs-radius': '6px',
  '--fs-gap': '1rem',
}

export const dark: ThemeTokens = {
  '--fs-color-text': '#f3f4f6',
  '--fs-color-muted': '#9ca3af',
  '--fs-color-border': '#374151',
  '--fs-color-bg': '#111827',
  '--fs-color-primary': '#3b82f6',
  '--fs-color-primary-text': '#ffffff',
  '--fs-color-error': '#f87171',
  '--fs-radius': '6px',
  '--fs-gap': '1rem',
}

export const themes: Record<string, ThemeTokens> = { light, dark }

/** Merge tokens; identity helper for authoring custom themes. */
export function defineTheme(...parts: ThemeTokens[]): ThemeTokens {
  return Object.assign({}, ...parts)
}

export type ThemeInput = 'light' | 'dark' | ThemeTokens

export function themeStyle(theme?: ThemeInput): CSSProperties {
  if (!theme) return {}
  if (typeof theme === 'string') return (themes[theme] ?? {}) as CSSProperties
  return theme as CSSProperties
}
