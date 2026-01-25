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

it('visits a pet profile, adds to favorites, and verifies in favorites page', () => {
  // 1. Setup intercepts
  cy.intercept('POST', '**/api/login', {
    statusCode: 200,
    body: { token: 'fake-token', user: { id: 1, name: 'John', email: 'john@example.com' } },
  }).as('login');

  cy.intercept('GET', '**/api/me', {
    statusCode: 200,
    body: { user: { id: 1, name: 'John', email: 'john@example.com' } },
  }).as('me');

  cy.intercept('GET', '**/api/pets/101*', {
    statusCode: 200,
    body: { 
      id: 101, 
      name: 'Max', 
      species: 'dog', 
      type: 'Labrador', 
      age: 2, 
      gender: 'male', 
      status: 'available', 
      description: 'A friendly dog.',
      profile_picture: '',
      shelter: { id: 1, name: 'Happy Tails', city: 'Paris' } 
    },
  }).as('petProfile');

  cy.intercept('GET', '**/api/favorites*', { statusCode: 200, body: [] }).as('favoritesEmpty');
  cy.intercept('POST', '**/api/pets/101/favorites', { statusCode: 201, body: { message: 'added' } }).as('addFavorite');

  // 2. Login
  cy.visit('/login', { failOnStatusCode: false });
  cy.get('[data-cy=login-email]').type('john@example.com', { force: true });
  cy.get('[data-cy=login-password]').type('Password123', { force: true });
  cy.get('[data-cy=login-submit]').click();
  cy.wait(['@login', '@me']);

  // 3. Visit Profile
  cy.visit('/pet/101', { failOnStatusCode: false });
  cy.wait('@petProfile');
  cy.wait(1500); // Wait for initial hydration recovery

  cy.get('[data-cy=pet-name]', { timeout: 20000 })
    .should('be.visible')
    .and('contain', 'Max');

  // 4. Prepare "Populated" favorites (flat array is safer for shared components)
  cy.intercept('GET', '**/api/favorites*', {
    statusCode: 200,
    body: [
      { id: 101, name: 'Max', species: 'dog', status: 'available', description: 'Le meilleur chien', profile_picture: '' } 
    ],
  }).as('favoritesWithMax');

  // 5. Action
  cy.get('[data-cy=favorite-button]').should('be.enabled').click();
  cy.wait('@addFavorite');

  // 6. Navigation to Favorites
  cy.visit('/favorites', { failOnStatusCode: false }); 
  
  // 7. CRITICAL: Wait for the intercept AND additional time for hydration loop to settle
  cy.wait('@favoritesWithMax');
  cy.wait(4000); 

  // Use get -> should instead of contains to handle DOM detaching
  cy.get('body', { timeout: 15000 })
    .should('contain', 'Max')
    .and('be.visible');
});
it('submits adoption form with validation and mocks API call', () => {
      // Mock login
      cy.intercept('POST', rxLogin, {
        statusCode: 200,
        body: { token: 'fake-token', user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
      }).as('login')
  
      cy.intercept('GET', rxMe, {
        statusCode: 200,
        body: { user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
      }).as('me')
  
      // Mock pet profile
      cy.intercept('GET', new RegExp(`${rxHost.source}/api/pets/101(.*)?`), {
        statusCode: 200,
        body: {
          id: 101,
          name: 'Max',
          species: 'dog',
          type: 'Labrador',
          age: 2,
          gender: 'male',
          profile_picture: '',
          status: 'available',
          description: 'Friendly dog',
          shelter: { id: 1, name: 'Happy Tails', city: 'Paris' }
        }
      }).as('petProfile')

      // Mock adoption application submission
      cy.intercept('POST', new RegExp(`${rxHost.source}/api/pets/101/apply(.*)?`), {
        statusCode: 200,
        body: { message: 'Application submitted successfully' }
      }).as('submitApplication')
  
      // Login first
      cy.visit('/login')
      cy.get('[data-cy=login-email]').type('john@example.com', { force: true })
      cy.get('[data-cy=login-password]').type('Password123', { force: true })
      cy.get('[data-cy=login-submit]').click()
      cy.wait(['@login', '@me'])
  
      // Visit pet profile
      cy.visit('/pet/101')
      cy.wait('@petProfile')
  
      // Open adoption form
      cy.get('[data-cy=adopt-button]').click()
  
      // Step 1: Fill personal information
      cy.contains('Single').click()
      cy.get('input[placeholder="+225 7777777777"]').type('  +212 612345678')
      cy.get('input[placeholder="28"]').type('25')
      cy.get('input[placeholder="Tanger Boukhalef"]').type('123 Main St')
  
      // Next to step 2
      cy.contains('Next →').click()
  
      // Step 2: Housing information
      cy.contains('Do you have any pets?').parent().contains('No').click() 
      cy.get('select').select('HOUSE') 
      cy.contains('Do you own or rent your home?').parent().contains('Own').click()
      cy.contains('Do you have a yard?').parent().contains('Yes').click()

  
      // Next to step 3
      cy.contains('Next →').click()
  
      // Step 3: Request details
      cy.get('textarea[placeholder="I\'m looking for a companion..."]').type('I want a companion for my family')

      // Be more specific with the checkbox to avoid checking "concerns" by mistake
      cy.contains('I have read and agree to the terms').parent().find('input[type="checkbox"]').check()
        
      // Submit form
      cy.contains('Send Request').click()
  
      // Confirm submission
      cy.contains('Confirm & Submit').click()
  
      // Wait for API call
      cy.wait('@submitApplication')
  
      // Verify success message
      cy.contains('Your adoption request for Max has been submitted successfully').should('exist')
    })
  
it('verifies adoption request appears in requests page with pending status', () => {
      // Mock login
      cy.intercept('POST', rxLogin, {
        statusCode: 200,
        body: { token: 'fake-token', user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
      }).as('login')
  
      cy.intercept('GET', rxMe, {
        statusCode: 200,
        body: { user: { id: 1, name: 'John', email: 'john@example.com', role: 'user' } },
      }).as('me')
  
      // Mock adoption requests
      cy.intercept('GET', new RegExp(`${rxHost.source}/api/adoptions(.*)?`), {
        statusCode: 200,
        body: [
          {
            id: 1,
            pet_id: 101,
            status: 'pending',
            created_at: new Date().toISOString(),
            form_data: {}
          }
        ]
      }).as('adoptions')

      // Mock pet details for the request
      cy.intercept('GET', new RegExp(`${rxHost.source}/api/pets/101(.*)?`), {
        statusCode: 200,
        body: {
          id: 101,
          name: 'Max',
          species: 'dog',
          type: 'Labrador',
          age: 2,
          gender: 'male',
          profile_picture: '',
          status: 'available',
          description: 'Friendly dog',
          shelter: { id: 1, name: 'Happy Tails', city: 'Paris' }
        }
      }).as('petDetails')
  
      // Login first
      cy.visit('/login')
      cy.get('[data-cy=login-email]').type('john@example.com', { force: true })
      cy.get('[data-cy=login-password]').type('Password123', { force: true })
      cy.get('[data-cy=login-submit]').click()
      cy.wait(['@login', '@me'])
  
      // Visit requests page
      cy.visit('/requests')
      cy.wait(['@adoptions', '@petDetails'])
  
      // Verify table exists and contains the request
      cy.get('[data-cy=requests-table]').should('exist')
      cy.contains('#1').should('exist')
      cy.contains('Max').should('exist')
      cy.contains('En Attente').should('exist')
    })


})
