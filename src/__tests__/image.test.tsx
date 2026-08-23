import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { FormSwitch } from '../FormSwitch'
import { buildDefaults, makeResolver } from '../schema/resolver'
import type { FieldSpec, FormSchema } from '../schema/types'

const png = (name = 'a.png', bytes = 5) =>
  new File([new Uint8Array(bytes)], name, { type: 'image/png' })

describe('image field resolver', () => {
  const field: FieldSpec = { name: 'photo', type: 'image', required: true, maxFiles: 2, maxSizeMB: 1 }
  const run = (values: Record<string, unknown>) =>
    makeResolver([field])(values, {}, { shouldUseNativeValidation: false, fields: {} } as never)

  it('defaults an image field to an empty array', () => {
    expect(buildDefaults([field])).toEqual({ photo: [] })
  })

  it('fails when required and empty', async () => {
    const r = await run({ photo: [] })
    expect((r.errors as Record<string, { message: string }>).photo.message).toBe('Required')
  })

  it('passes with a valid file', async () => {
    const r = await run({ photo: [png()] })
    expect(r.errors).toEqual({})
  })

  it('enforces maxFiles', async () => {
    const r = await run({ photo: [png('a.png'), png('b.png'), png('c.png')] })
    expect((r.errors as Record<string, { message: string }>).photo.message).toMatch(/At most 2/)
  })

  it('enforces maxSizeMB', async () => {
    const big = png('big.png', 2 * 1024 * 1024)
    const r = await run({ photo: [big] })
    expect((r.errors as Record<string, { message: string }>).photo.message).toMatch(/≤ 1MB/)
  })
})

describe('image field component', () => {
  const schema: FormSchema = {
    payload: 'json',
    fields: [{ name: 'photo', type: 'image', label: 'Photo', maxFiles: 2 }],
  }

  it('renders a dropzone', () => {
    render(<FormSwitch schema={schema} onSubmit={vi.fn()} />)
    expect(screen.getByText(/drag images here/i)).toBeInTheDocument()
  })

  it('adds a file, previews it, and submits base64 in json', async () => {
    const onSubmit = vi.fn()
    const { container } = render(<FormSwitch schema={schema} onSubmit={onSubmit} />)

    const input = container.querySelector('input[type=file]') as HTMLInputElement
    await userEvent.upload(input, png('cat.png'))

    // preview shown
    expect(await screen.findByAltText('cat.png')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    const payload = onSubmit.mock.calls[0][0] as { photo: string[] }
    expect(payload.photo[0]).toMatch(/^data:image\/png;base64,/)
  })

  it('rejects files over the type filter', async () => {
    render(
      <FormSwitch
        schema={{ fields: [{ name: 'p', type: 'image', label: 'P', accept: ['image/jpeg'] }] }}
        onSubmit={vi.fn()}
      />,
    )
    const input = document.querySelector('input[type=file]') as HTMLInputElement
    // upload a png where only jpeg is accepted
    fireEvent.change(input, { target: { files: [png('x.png')] } })
    expect(await screen.findByText(/type not allowed/i)).toBeInTheDocument()
  })
})
