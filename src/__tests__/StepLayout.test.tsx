import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FormSwitch } from '../FormSwitch'
import type { FormSchema } from '../schema/types'

const schema: FormSchema = {
  steps: [
    {
      title: 'Account',
      fields: [{ name: 'user', type: 'text', label: 'User', validation: z.string().min(1, 'required') }],
    },
    {
      title: 'Profile',
      fields: [{ name: 'bio', type: 'textarea', label: 'Bio' }],
    },
  ],
  payload: 'json',
}

describe('FormSwitch (multi-step)', () => {
  it('shows only the first step initially', () => {
    render(<FormSwitch schema={schema} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('User')).toBeInTheDocument()
    expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument()
  })

  it('blocks Next when current step is invalid', async () => {
    render(<FormSwitch schema={schema} onSubmit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('required')).toBeInTheDocument()
    expect(screen.queryByLabelText('Bio')).not.toBeInTheDocument()
  })

  it('advances, goes back, and submits on the last step', async () => {
    const onSubmit = vi.fn()
    render(<FormSwitch schema={schema} onSubmit={onSubmit} />)

    await userEvent.type(screen.getByLabelText('User'), 'ada')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    expect(await screen.findByLabelText('Bio')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Bio'), 'hi')

    // Back preserves state
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByLabelText('User')).toHaveValue('ada')
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ user: 'ada', bio: 'hi' })
  })
})
