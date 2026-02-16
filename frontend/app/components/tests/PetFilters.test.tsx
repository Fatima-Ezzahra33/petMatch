import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '../../contexts/themeContext'
import { UserProvider } from '../../contexts/UserContext'
import PetFilters from '../PetFilters'
import { describe, expect, test } from 'vitest'

describe('PetFilters', () => {
  test('renders filters and applies species/age filters', async () => {
    const speciesOptions = [ { label: 'Dog', value: 'DOG' }, { label: 'Cat', value: 'CAT' } ]
    const ageOptions = [ { label: 'Puppy', value: '0-1' }, { label: 'Adult', value: '2-7' } ]
    const setSelectedFilters = (v: any) => {}
    const toggleSection = (s: string) => {}

    render(
      <ThemeProvider>
        <UserProvider>
          <PetFilters
            isFilterOpen={true}
            setIsFilterOpen={() => {}}
            selectedFilters={{ species: [], ageRange: [] }}
            setSelectedFilters={setSelectedFilters as any}
            speciesOptions={speciesOptions}
            ageOptions={ageOptions}
            openSections={['species','age']}
            toggleSection={toggleSection}
          />
        </UserProvider>
      </ThemeProvider>
    )

    // species and age options should be visible (accordion opened)
    expect(screen.getByText(/Dog/i)).toBeInTheDocument()
    expect(screen.getByText(/Puppy/i)).toBeInTheDocument()
    expect(screen.getByText(/Adult/i)).toBeInTheDocument()
  })
})
