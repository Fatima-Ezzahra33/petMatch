import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import AdoptionForm from '../AdoptionForm'

describe('AdoptionForm multi-step', () => {
  test('renders modal and shows validation error when required fields missing', async () => {
    const onClose = vi.fn()
    const onSuccess = vi.fn()
    const onError = vi.fn()

    render(
      <ThemeProvider>
        <UserProvider>
          <AdoptionForm isOpen={true} petId={1} petName="Fido" onClose={onClose} onSuccess={onSuccess} onError={onError} />
        </UserProvider>
      </ThemeProvider>
    )

    // Modal header shows
    expect(screen.getByText(/Pet Adoption Form/i)).toBeInTheDocument()

    // Click Next without filling required fields should show validation error
    await userEvent.click(screen.getByText(/Next/))
    expect(screen.getByText(/Please fill in all required fields/i)).toBeInTheDocument()
  })
})
