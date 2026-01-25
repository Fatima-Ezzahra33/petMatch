/// <reference types="cypress" />

// Use localhost to match the actual API calls from the frontend services
const apiBase = 'http://localhost:8000/api'
// Regex helpers to match both localhost and 127.0.0.1 and any query params
const rxHost = /https?:\/\/(localhost|127\.0\.0\.1):8000/;
const rxLogin = new RegExp(`${rxHost.source}\/api\/login(.*)?`);
const rxMe = new RegExp(`${rxHost.source}\/api\/me(.*)?`);
const rxPets = new RegExp(`${rxHost.source}\/api\/pets(.*)?`);

describe('User Adoption Flow', () => {
  beforeEach(() => {
    // reset local storage between tests
    cy.clearLocalStorage()
  })

  it('registers a new user with validations', () => {
    const rxRegister = new RegExp(`${rxHost.source}\/api\/register(.*)?`);
    cy.intercept('POST', rxRegister, (req) => {
      const { email, password, password_confirmation } = req.body

      if (email === 'taken@example.com') {
        req.reply({ statusCode: 422, body: { message: 'Email already used' } })
        return
      }
      if (password !== password_confirmation) {
        req.reply({ statusCode: 422, body: { message: "Passwords don't match" } })
        return
      }

      req.reply({ statusCode: 200, body: { token: 'fake-token', user: { id: 1, name: 'John', email, role: 'user' } } })
    }).as('register')

    cy.visit('/register')

    // missing accept terms
    cy.get('[data-cy=register-form]').within(() => {
      cy.get('[data-cy=register-name]').type('John Doe')
      cy.get('[data-cy=register-email]').type('john@example.com')
      cy.get('[data-cy=register-password]').type('Password123')
      cy.get('[data-cy=register-password-confirm]').type('Password123')
      cy.get('[data-cy=register-submit]').click()
    })
    cy.contains('Please accept the terms').should('exist')

    // email already used
    cy.get('[data-cy=register-accept-terms]').check()
    cy.get('[data-cy=register-email]').clear().type('taken@example.com')
    cy.get('[data-cy=register-submit]').click()
    cy.wait('@register')
    cy.contains('Email already used').should('exist')

    // passwords mismatch (client validation prevents network call; do not wait on @register)
    cy.get('[data-cy=register-email]').clear().type('john@example.com')
    cy.get('[data-cy=register-password]').clear().type('Password123')
    cy.get('[data-cy=register-password-confirm]').clear().type('Password124')
    cy.get('[data-cy=register-submit]').click()
    cy.contains('Passwords do not match').should('exist')

    // successful registration
    cy.get('[data-cy=register-password-confirm]').clear().type('Password123')
    cy.get('[data-cy=register-submit]').click()
    cy.wait('@register')

    // After success component appears, show verification screen
    cy.contains('Registration Succeeded!').should('exist')
  })

  it('logs in a user and redirects to /welcome-user', () => {
    cy.intercept('POST', rxLogin, {
      statusCode: 200,
      body: { token: 'fake-token', user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
    }).as('login')

    // mock /api/me used after login to fetch role
    cy.intercept('GET', rxMe, {
      statusCode: 200,
      body: { user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
    }).as('me')

    cy.visit('/login')
    cy.get('[data-cy=login-email]').type('john@example.com', { force: true })
    cy.get('[data-cy=login-password]').type('Password123', { force: true })
    cy.get('[data-cy=login-submit]').click()

    cy.wait(['@login', '@me'])

    // should redirect; assert on url or page content
    cy.url().should('include', '/welcome-user')
  })

  it('navigates to pets list and filters by species and age', () => {
    // Intercept pets list (match both localhost and 127.0.0.1 and any query)
    cy.intercept('GET', rxPets, {
      statusCode: 200,
      body: [
        { id: 101, name: 'Max', species: 'dog', type: 'Labrador', age: 2, gender: 'male', profile_picture: '', status: 'available', description: '', shelter: {} },
        { id: 102, name: 'Luna', species: 'cat', type: 'Siamese', age: 4, gender: 'female', profile_picture: '', status: 'available', description: '', shelter: {} },
        { id: 103, name: 'Bella', species: 'dog', type: 'Beagle', age: 0.5, gender: 'female', profile_picture: '', status: 'available', description: '', shelter: {} },
      ]
    }).as('pets')

    cy.visit('/pets-list', { failOnStatusCode: false })
    cy.wait('@pets')

    // Ensure grid is present before asserting on children
    cy.get('[data-cy=pets-grid]', { timeout: 10000 }).should('exist')

    // grid shows 3
    cy.get('[data-cy=pets-grid] > *', { timeout: 10000 }).should('have.length', 3)

    // 1. Ouvrir le menu Filters
cy.contains('button', 'Filters').click()

// 2. Dérouler la section 'Species'
cy.contains('Species').click()
// Maintenant "Dogs" devrait apparaître
cy.contains('Dogs').click()

// 3. Dérouler la section 'Age'
cy.contains('Age').click()
// Maintenant "<12 months" devrait apparaître
cy.contains('<12 months').click()

// 4. TRÈS IMPORTANT : Cliquer sur le bouton 'Apply' pour valider les filtres
cy.contains('button', 'Apply').click()

// 5. Vérifier les résultats dans la grille
cy.get('[data-cy=pets-grid] > *', { timeout: 10000 }).should('have.length', 1)
cy.get('[data-cy=pets-grid]').contains('Bella')
 })
})