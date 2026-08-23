import type { ComponentType } from 'react'

export type LoaderComponent = ComponentType

const registry = new Map<string, LoaderComponent>()

export function registerLoader(name: string, component: LoaderComponent): void {
  registry.set(name, component)
}

export function getLoader(name = 'spinner'): LoaderComponent {
  return registry.get(name) ?? registry.get('spinner')!
}

/** Picks a registered loader by name (falls back to "spinner"). */
export function Loader({ name }: { name?: string }) {
  const C = getLoader(name)
  return <C />
}

/* ---- built-in loaders (CSS-only, inherit currentColor & 1em size) ---- */

const box = (variant: string, dots = 0) => {
  const Comp = () => (
    <span className={`fs-loader fs-loader-${variant}`} role="status" aria-label="Loading">
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} />
      ))}
    </span>
  )
  Comp.displayName = `FS_loader_${variant}`
  return Comp
}

registerLoader('spinner', box('spinner'))
registerLoader('ring', box('ring'))
registerLoader('pulse', box('pulse'))
registerLoader('dots', box('dots', 3))
registerLoader('bars', box('bars', 3))
