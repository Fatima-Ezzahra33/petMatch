import React from 'react'
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import PetCardAI from '../PetCardAI'
import { MemoryRouter } from 'react-router-dom'

describe('PetCardAI', () => {
  test('renders compatibility score and species emoji', () => {
    const pet = { id: 2, name: 'Whiskers', species: 'CAT', type: 'Siamese', age: 3, gender: 'female', profile_picture: null, status: 'available', description: '', score: 87 }
    render(
      <MemoryRouter>
        <ThemeProvider>
          <UserProvider>
            <PetCardAI props={pet} />
          </UserProvider>
        </ThemeProvider>
      </MemoryRouter>
    )

    expect(screen.getByText(/87%/)).toBeInTheDocument()
    expect(screen.getByText(/🐈|cat/i)).toBeTruthy()
  })
})
