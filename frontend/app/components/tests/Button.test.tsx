import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import Button from '../Button'

describe('Button', () => {
  test('renders primary and secondary variants and handles click', async () => {
    const handle = vi.fn()
    render(
      <div>
        <Button variant="primary" onClick={handle}>Primary</Button>
        <Button variant="secondary" disabled>Disabled</Button>
      </div>
    )

    const primary = screen.getByText(/Primary/i)
    await userEvent.click(primary)
    expect(handle).toHaveBeenCalled()

    const disabled = screen.getByText(/Disabled/i)
    expect(disabled).toBeDisabled()
  })
})
