import { vi } from 'vitest'

// Mock react-router hooks to avoid needing a full Router in these unit tests
vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(), () => {}],
  Link: (props: any) => null,
}))

import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import { AuthProvider } from '../../contexts/auth'
import Register from '../Register'

describe('Register route', () => {
  test('renders register route (smoke)', () => {
    const { container } = render(
      <MemoryRouter>
        <ThemeProvider>
          <UserProvider>
            <AuthProvider>
              <Register />
            </AuthProvider>
          </UserProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
    expect(container.firstChild).toBeTruthy()
  })
})
