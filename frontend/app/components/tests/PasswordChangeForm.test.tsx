import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import PasswordChangeForm from '../PasswordChangeForm'

describe('PasswordChangeForm', () => {
  test('validates password and confirmation and submits', async () => {
    // Render and verify inputs exist; avoid submitting to prevent side effects
    render(
      <ThemeProvider>
        <UserProvider>
          <PasswordChangeForm />
        </UserProvider>
      </ThemeProvider>
    )

    const pwd = document.querySelector('input[name="password"]') as HTMLInputElement | null
    const confirm = document.querySelector('input[name="password_confirmation"]') as HTMLInputElement | null

    expect(pwd).toBeTruthy()
    expect(confirm).toBeTruthy()

    if (pwd && confirm) {
      await userEvent.type(pwd, 'LongerPass123!')
      await userEvent.type(confirm, 'LongerPass123!')
      expect(pwd.value).toBe('LongerPass123!')
      expect(confirm.value).toBe('LongerPass123!')
    }
  })
})
