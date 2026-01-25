/// <reference types="cypress" />
describe('PetMatch smoke test', () => {
  it('loads the homepage', () => {
    cy.visit('/')
    cy.contains('Pet').should('exist')
  })
})
