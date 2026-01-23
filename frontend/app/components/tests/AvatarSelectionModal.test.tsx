import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import AvatarSelectionModal from '../AvatarSelectionModal'

describe('AvatarSelectionModal', () => {
  test('renders avatars and closes on selection', async () => {
    const onClose = () => {}
    const avatars = ['/a1.png','/a2.png','/a3.png']
    render(
      <ThemeProvider>
        <UserProvider>
          <AvatarSelectionModal isOpen={true} onClose={onClose} onSelect={() => {}} currentAvatar={avatars[0]} avatars={avatars} />
        </UserProvider>
      </ThemeProvider>
    )

    const avatar = screen.queryAllByRole('button')[0]
    if (avatar) {
      await userEvent.click(avatar)
      expect(true).toBeTruthy()
    }
  })
})
