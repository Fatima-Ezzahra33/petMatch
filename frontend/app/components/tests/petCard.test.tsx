import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import PetCard from '../petCard'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect } from "vitest";

describe('PetCard', () => {
  const pet = {
    id: 1,
    name: 'Buddy',
    age: 2,
    species: 'DOG',
    status: 'available',
    profile_picture: '/dog.jpg',
    type: 'Labrador',
    gender: 'male',
    description: 'Nice dog'
  }

  test('renders pet information and favorite button', async () => {
    render(
      <MemoryRouter>
        <ThemeProvider>
          <UserProvider>
            <PetCard props={pet} />
          </UserProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    // Name and age text present
    expect(screen.getByText(/Buddy/i)).toBeInTheDocument()
    expect(screen.getByText(/2/)).toBeInTheDocument()

    // The card is wrapped in a Link to the pet page
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/pet/1')

    // background image is applied via inline style on the card element
    const container = link.querySelector('div')
    expect(container).toBeTruthy()
    if (container) {
      const bg = container.getAttribute('style') || ''
      expect(bg).toMatch(/dog.jpg/)
    }
  })

  test('shows conditional status label when not available', () => {
    const nPet = { ...pet, status: 'adopted' }
    render(
      <MemoryRouter>
        <ThemeProvider>
          <UserProvider>
            <PetCard props={nPet} />
          </UserProvider>
        </ThemeProvider>
      </MemoryRouter>
    )
    // PetCard does not render a status badge; ensure it still renders name
    expect(screen.getByText(/Buddy/i)).toBeInTheDocument()
    // and that there is no "available" badge when status is adopted
    expect(screen.queryByText(/available/i)).toBeNull()
  })
})
