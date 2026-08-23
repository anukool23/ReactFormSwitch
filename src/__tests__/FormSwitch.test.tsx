import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { FormSwitch } from '../FormSwitch'
import { registerField } from '../registry/fields'
import type { FormSchema } from '../schema/types'

describe('FormSwitch (single page)', () => {
  const schema: FormSchema = {
    fields: [
      { name: 'name', type: 'text', label: 'Name', validation: z.string().min(1, 'Name required') },
      { name: 'email', type: 'email', label: 'Email', validation: z.string().email('Bad email') },
    ],
    submitLabel: 'Go',
  }

  it('renders labels and a submit button', () => {
    render(<FormSwitch schema={schema} onSubmit={vi.fn()} />)
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
  })

  it('blocks submit and shows errors on invalid input', async () => {
    const onSubmit = vi.fn()
    render(<FormSwitch schema={schema} onSubmit={onSubmit} />)
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(await screen.findByText('Name required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a json payload on valid input', async () => {
    const onSubmit = vi.fn()
    render(<FormSwitch schema={schema} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Ada')
    await userEvent.type(screen.getByLabelText('Email'), 'ada@x.com')
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', email: 'ada@x.com' }, expect.anything())
  })

  it('emits FormData when payload is formdata', async () => {
    const onSubmit = vi.fn()
    render(<FormSwitch schema={{ ...schema, payload: 'formdata' }} onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Name'), 'Ada')
    await userEvent.type(screen.getByLabelText('Email'), 'ada@x.com')
    await userEvent.click(screen.getByRole('button', { name: 'Go' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const payload = onSubmit.mock.calls[0][0] as FormData
    expect(payload).toBeInstanceOf(FormData)
    expect(payload.get('name')).toBe('Ada')
  })

  it('shows/hides conditional fields and omits hidden values from payload', async () => {
    const onSubmit = vi.fn()
    const conditional: FormSchema = {
      fields: [
        { name: 'subscribe', type: 'checkbox', label: 'Subscribe' },
        {
          name: 'topic',
          type: 'text',
          label: 'Topic',
          showIf: (v) => v.subscribe === true,
        },
      ],
    }
    render(<FormSwitch schema={conditional} onSubmit={onSubmit} />)
    expect(screen.queryByLabelText('Topic')).not.toBeInTheDocument()

    await userEvent.click(screen.getByLabelText('Subscribe'))
    expect(await screen.findByLabelText('Topic')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Topic'), 'news')
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toEqual({ subscribe: true, topic: 'news' })
  })

  it('renders custom-registered field types', async () => {
    registerField('color', ({ id, value, onChange }) => (
      <input id={id} type="color" value={String(value || '#000000')} onChange={(e) => onChange(e.target.value)} />
    ))
    render(
      <FormSwitch
        schema={{ fields: [{ name: 'c', type: 'color', label: 'Pick' }] }}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Pick')).toHaveAttribute('type', 'color')
  })
})
