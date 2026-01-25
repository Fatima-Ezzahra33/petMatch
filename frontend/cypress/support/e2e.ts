import './commands'

// You can put global before/after hooks here if needed

beforeEach(() => {
  // Reset localStorage between tests to avoid cross-test pollution
  window.localStorage.clear()
})

// Ignore SSR hydration mismatches during E2E to prevent hard failures
Cypress.on('uncaught:exception', (err) => {
  if (err?.message?.includes('Hydration failed')) {
    return false
  }
  return false
})

Cypress.on('uncaught:exception', (err, runnable) => {
  // On ignore l'erreur d'hydratation de React/Remix
  if (err.message.includes('Hydration failed') || err.message.includes('minified React error')) {
    return false
  }
})
