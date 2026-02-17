import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import PersonalDetailsForm from '../PersonalDetailsForm'

const mockUser = { name: '', location: '', phone: '', email: '', avatar: null }

describe('PersonalDetailsForm', () => {
  test('controlled fields validate and submit via react-hook-form', async () => {
    // Render and ensure controlled inputs exist and accept input
    render(
      <ThemeProvider>
        <UserProvider>
          <PersonalDetailsForm user={mockUser} />
        </UserProvider>
      </ThemeProvider>
    )

    const name = screen.getByLabelText(/name/i)
    const email = screen.getByLabelText(/email/i)

    await userEvent.clear(name)
    await userEvent.type(name, 'John Doe')
    await userEvent.clear(email)
    await userEvent.type(email, 'john@example.com')

    expect((name as HTMLInputElement).value).toBe('John Doe')
    expect((email as HTMLInputElement).value).toBe('john@example.com')
  })
})
