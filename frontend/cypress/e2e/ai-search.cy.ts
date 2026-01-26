describe('AI Search', () => {
  // Prevent Cypress from failing on React Hydration errors
  Cypress.on('uncaught:exception', (err) => {
    if (err.message.includes('Hydration failed') || err.message.includes('Minified React error')) {
      return false;
    }
  });

  const mockPets = [
    {
      id: 2,
      name: 'High Match',
      score: 95,
      species: 'cat',
      status: 'available',
      profile_picture: null
    },
    {
      id: 3,
      name: 'Medium Match',
      score: 80,
      species: 'dog',
      status: 'available',
      profile_picture: null
    },
    {
      id: 1,
      name: 'Low Match',
      score: 70,
      species: 'cat',
      status: 'available',
      profile_picture: null
    }
  ];

  beforeEach(() => {
    // Mock login state
    window.localStorage.setItem('token', 'fake-token');
    window.localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Tester' }));
    cy.visit('/welcome-user');
  });

  it('should display loading spinner during AI search request', () => {
    cy.intercept('POST', '**/api/match-pets', {
      delay: 1000,
      body: { pets: mockPets, total: 3 }
    }).as('matchPets');

    cy.get('[data-cy="ai-search-textarea"]').type('Searching...');
    cy.get('[data-cy="ai-search-submit"]').click();
    cy.get('[data-cy="ai-search-submit"]').should('contain', 'Finding your perfect match...');
    cy.wait('@matchPets');
  });

  it('should redirect to match-results page and display scores', () => {
    cy.intercept('POST', '**/api/match-pets', {
      statusCode: 200,
      body: { pets: mockPets, total: 3, message: 'Matches found!' }
    }).as('matchPets');

    cy.get('[data-cy="ai-search-textarea"]').type('Calm cat');
    cy.get('[data-cy="ai-search-submit"]').click();

    cy.wait('@matchPets');
    
    // Ensure navigation is finished
    cy.url().should('include', '/match-results');
    cy.get('[data-cy="match-results-header"]').should('be.visible');

    // Verify the scores appear correctly
    cy.get('[data-cy="pet-match-score"]').first().should('be.visible').and('contain', '95% Match');
  });

  it('should display results in the order provided by the API (Descending)', () => {
    // We provide the mock pets already sorted by score [95, 80, 70]
    cy.intercept('POST', '**/api/match-pets', {
      statusCode: 200,
      body: { pets: mockPets, total: 3 }
    }).as('matchPets');

    cy.get('[data-cy="ai-search-textarea"]').type('Sort test');
    cy.get('[data-cy="ai-search-submit"]').click();
    
    cy.wait('@matchPets');
    
    // Check URL to ensure page loaded
    cy.url().should('include', '/match-results');

    // Validate UI order matches our mock data
    cy.get('[data-cy="pet-match-score"]').should('have.length', 3);
    cy.get('[data-cy="pet-match-score"]').eq(0).should('contain', '95% Match');
    cy.get('[data-cy="pet-match-score"]').eq(1).should('contain', '80% Match');
    cy.get('[data-cy="pet-match-score"]').eq(2).should('contain', '70% Match');
  });

  it('should handle different search queries', () => {
    const queries = ['Cat', 'Dog'];

    queries.forEach((query) => {
      cy.intercept('POST', '**/api/match-pets', {
        statusCode: 200,
        body: { pets: [mockPets[0]], total: 1 }
      }).as('matchPets');

      cy.visit('/welcome-user');
      cy.get('[data-cy="ai-search-textarea"]').type(query);
      cy.get('[data-cy="ai-search-submit"]').click();
      cy.wait('@matchPets');
      cy.url().should('include', '/match-results');
    });
  });
});