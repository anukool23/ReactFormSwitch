import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FormSwitch } from '../FormSwitch'
import { uiToStyle, sizeFont } from '../theme/ui'
import type { FormSchema } from '../schema/types'

describe('uiToStyle', () => {
  it('maps theme keys, size, button color and maxWidth', () => {
    const s = uiToStyle({
      size: 'lg',
      maxWidth: '500px',
      theme: { primary: '#f00', radius: '12px', borderWidth: '2px' },
      button: { color: '#0f0', textColor: '#000' },
    }) as Record<string, string>
    expect(s['--fs-color-primary']).toBe('#f00')
    expect(s['--fs-radius']).toBe('12px')
    expect(s['--fs-border-width']).toBe('2px')
    expect(s['--fs-btn-bg']).toBe('#0f0')
    expect(s['--fs-btn-text']).toBe('#000')
    expect(s['--fs-font-size']).toBeDefined() // from size
    expect(s.maxWidth).toBe('500px')
  })

  it('is empty for an empty config', () => {
    expect(uiToStyle({})).toEqual({})
  })
})

describe('sizeFont', () => {
  it('maps presets to a font size', () => {
    expect(sizeFont('md')).toBe('1rem')
    expect(sizeFont('4xl')).toBe('2.25rem')
  })
  it('passes custom CSS lengths through', () => {
    expect(sizeFont('18px')).toBe('18px')
    expect(sizeFont('1.2em')).toBe('1.2em')
  })
  it('is undefined when unset', () => {
    expect(sizeFont(undefined)).toBeUndefined()
    expect(sizeFont('')).toBeUndefined()
  })
})

const invalidThenSubmit = (schema: FormSchema) => {
  render(<FormSwitch schema={schema} onSubmit={vi.fn()} />)
  return userEvent.click(screen.getByRole('button', { name: 'Submit' }))
}

describe('error display modes', () => {
  const base: FormSchema = {
    fields: [{ name: 'name', type: 'text', label: 'Name', validation: z.string().min(1, 'Required') }],
  }

  it('sets data attributes on the form root', () => {
    const { container } = render(
      <FormSwitch
        schema={{ ...base, ui: { errors: 'toast', labelPosition: 'left', button: { position: 'center' } } }}
        onSubmit={vi.fn()}
      />,
    )
    const form = container.querySelector('form')!
    expect(form.dataset.errors).toBe('toast')
    expect(form.dataset.label).toBe('left')
    expect(form.dataset.btn).toBe('center')
  })

  it('shows a toast per error in toast mode', async () => {
    await invalidThenSubmit({ ...base, ui: { errors: 'toast' } })
    const toast = await screen.findByText('Name: Required')
    expect(toast).toHaveClass('fs-toast-error')
  })

  it('shows an error popup in popup mode', async () => {
    await invalidThenSubmit({ ...base, ui: { errors: 'popup' } })
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText('Name: Required')).toBeInTheDocument()
  })

  it('shows a success toast after a valid submit', async () => {
    render(
      <FormSwitch
        schema={{ ...base, ui: { toast: { successMessage: 'Saved!' } } }}
        onSubmit={vi.fn()}
      />,
    )
    await userEvent.type(screen.getByLabelText('Name'), 'Ada')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(screen.getByText('Saved!')).toHaveClass('fs-toast-success'))
  })
})
