import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import AdminPetCard from '../AdminPetCard'

describe('AdminPetCard', () => {
  const pet = { id: 5, name: 'Milo', profile_picture: null, status: 'available', description: 'Admin pet' }

  test('shows admin actions menu and edit/delete buttons', async () => {
    const onToggleMenu = () => {}
    const onEdit = () => {}
    const onDelete = () => {}

    const renderResult = render(
      <ThemeProvider>
        <UserProvider>
          <AdminPetCard
            pet={pet as any}
            isDarkMode={false}
            isMenuOpen={true}
            onToggleMenu={onToggleMenu}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </UserProvider>
      </ThemeProvider>
    )

    // menu trigger (select by data attribute)
    const { container } = renderResult
    const menu = container.querySelector('button[data-menu-button="true"]')
    expect(menu).toBeTruthy()

    if (menu) await userEvent.click(menu)
    // since isMenuOpen=true we expect Edit/Delete to be in the document
    expect(screen.getByText(/Edit/i)).toBeInTheDocument()
    expect(screen.getByText(/Delete/i)).toBeInTheDocument()
  })
})
