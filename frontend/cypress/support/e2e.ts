import './commands'

// You can put global before/after hooks here if needed

beforeEach(() => {
  // Reset localStorage between tests to avoid cross-test pollution
  window.localStorage.clear()
})

// Ignore SSR hydration mismatches during E2E to prevent hard failures

Cypress.on('uncaught:exception', (err) => {
  if (err.message.includes('Hydration failed') || err.message.includes('minified React error #418')) {
    return false;
  }
});
