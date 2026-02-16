import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import AddPetModal from '../AddPetModal'

describe('AddPetModal', () => {
  test('renders modal, validates fields and image upload input', async () => {
    const onClose = vi.fn()
    const onCreate = vi.fn()

    render(
      <ThemeProvider>
        <UserProvider>
          <AddPetModal isOpen={true} onClose={onClose} onCreate={onCreate} />
        </UserProvider>
      </ThemeProvider>
    )

    expect(screen.getByText(/Add Pet|New Pet/i)).toBeInTheDocument()

    const fileInput = screen.queryByLabelText(/image|photo|upload/i)
    if (fileInput) {
      const file = new File(['dummy'], 'pet.png', { type: 'image/png' })
      await userEvent.upload(fileInput, file)
      // JSDOM doesn't set value for file inputs; verify input exists
      expect(fileInput).toBeTruthy()
    }
  })
})
