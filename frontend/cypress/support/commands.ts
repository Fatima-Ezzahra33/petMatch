/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login to the application
       * @example cy.login('user@example.com', 'password')
       */
      login(email?: string, password?: string): Chainable<void>
      
      /**
       * Custom command to logout and clear local storage
       */
      logout(): Chainable<void>
      
      /**
       * Custom command to intercept API calls with a base URL prefix
       */
      interceptAPI(
        method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', 
        path: string | RegExp, 
        alias: string, 
        response?: any, 
        status?: number
      ): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email = 'user@example.com', password = 'password') => {
  const apiBase = Cypress.env('API_BASE') || 'http://localhost:8000/api'
  
  // FIX: Added the missing cy.request call
  cy.request('POST', `${apiBase}/login`, { email, password })
    .then((res) => {
      const { token, user } = res.body
      // Best practice: interacting with window via cy.window()
      cy.window().then((win) => {
        win.localStorage.setItem('token', token)
        win.localStorage.setItem('user', JSON.stringify(user))
      })
    })
})

Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token')
    win.localStorage.removeItem('user')
  })
})

Cypress.Commands.add('interceptAPI', (method, path, alias, response, status = 200) => {
  const apiBase = Cypress.env('API_BASE') || 'http://localhost:8000/api'
  
  // Handle path logic: if it's a string, prefix it; if RegExp, leave as is
  const url = typeof path === 'string' ? `${apiBase}${path}` : path
  
  cy.intercept(method, url, (req) => {
    if (response !== undefined) {
      req.reply({ 
        statusCode: status, 
        body: response 
      })
    }
  }).as(alias)
})

export {}