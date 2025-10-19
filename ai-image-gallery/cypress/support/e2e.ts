// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to select DOM element by data-testid attribute.
       * @example cy.getByTestId('my-element')
       */
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      
      /**
       * Custom command to mock authentication
       * @example cy.mockAuth()
       */
      mockAuth(): Chainable<void>;
      
      /**
       * Custom command to mock images data
       * @example cy.mockImages()
       */
      mockImages(): Chainable<void>;
    }
  }
}
