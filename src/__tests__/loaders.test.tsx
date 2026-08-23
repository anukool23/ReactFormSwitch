import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormSwitch } from '../FormSwitch'
import { getLoader, registerLoader } from '../registry/loaders'
import type { FormSchema } from '../schema/types'

describe('loaders', () => {
  it('returns built-in loaders and falls back to spinner', () => {
    expect(getLoader('dots')).toBeTypeOf('function')
    expect(getLoader('nope')).toBe(getLoader('spinner'))
  })

  it('supports custom loaders', () => {
    const Custom = () => <span data-testid="custom-loader" />
    registerLoader('custom', Custom)
    expect(getLoader('custom')).toBe(Custom)
  })

  it('shows the chosen loader and disables the button while submitting', async () => {
    let release!: () => void
    const onSubmit = vi.fn(() => new Promise<void>((r) => (release = r)))
    const schema: FormSchema = { fields: [{ name: 'a', type: 'text' }], loader: 'dots' }

    render(<FormSwitch schema={schema} onSubmit={onSubmit} />)
    const btn = screen.getByRole('button', { name: 'Submit' })
    await userEvent.click(btn)

    await waitFor(() => expect(btn).toBeDisabled())
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(btn.querySelector('.fs-loader-dots')).toBeInTheDocument()

    release()
    await waitFor(() => expect(btn).not.toBeDisabled())
    expect(btn.querySelector('.fs-loader')).not.toBeInTheDocument()
  })
})
