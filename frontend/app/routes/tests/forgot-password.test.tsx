import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'

// Mock react-router where needed
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: (props: any) => null,
}))

import ForgotPassword from '../forgot-password'

describe('Forgot password', () => {
  test('renders forgot password form', () => {
    const { container } = render(
      <ThemeProvider>
        <UserProvider>
          <ForgotPassword />
        </UserProvider>
      </ThemeProvider>
    )

    expect(container.firstChild).toBeTruthy()
  })
})
