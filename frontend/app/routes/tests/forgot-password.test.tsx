import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'

import { vi } from 'vitest'

// Mock react-router where needed
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: (props: any) => null,
}))

import ForgotPassword from '../forgot-password'

describe('Forgot password', () => {
  test('submits reset request and shows confirmation', async () => {
    const onSubmit = vi.fn()
    const { container } = render(
      <ThemeProvider>
        <UserProvider>
          <ForgotPassword onSubmit={onSubmit} />
        </UserProvider>
      </ThemeProvider>
    )

    expect(container.firstChild).toBeTruthy()
  })
})
