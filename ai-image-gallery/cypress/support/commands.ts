// Custom commands
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

Cypress.Commands.add('mockAuth', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('supabase.auth.token', 'mock-token');
    win.localStorage.setItem('supabase.auth.user', JSON.stringify({
      id: 'test-user-id',
      email: 'test@example.com',
    }));
  });
});

Cypress.Commands.add('mockImages', () => {
  cy.window().then((win) => {
    const mockImages = [
      {
        id: '1',
        original_filename: 'test1.jpg',
        thumbnail_url: 'https://via.placeholder.com/300',
        original_url: 'https://via.placeholder.com/800',
        processing_status: 'completed',
        ai_tags: ['nature', 'landscape'],
        ai_description: 'A beautiful landscape',
        dominant_colors: ['#4A90E2', '#7ED321'],
        file_size: 1024000,
        uploaded_at: new Date().toISOString(),
      },
      {
        id: '2',
        original_filename: 'test2.jpg',
        thumbnail_url: 'https://via.placeholder.com/300',
        original_url: 'https://via.placeholder.com/800',
        processing_status: 'processing',
        ai_tags: [],
        ai_description: '',
        dominant_colors: [],
        file_size: 2048000,
        uploaded_at: new Date().toISOString(),
      },
    ];
    
    win.localStorage.setItem('mock-images', JSON.stringify(mockImages));
  });
});

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on uncaught exceptions
  // that are not related to the test
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  return true;
});

// Add custom assertions
declare global {
  namespace Cypress {
    interface Chainer<Subject> {
      /**
       * Custom assertion to check if element has proper ARIA attributes
       */
      haveProperAriaAttributes(): Chainable<Subject>;
      
      /**
       * Custom assertion to check if element is accessible
       */
      beAccessible(): Chainable<Subject>;
    }
  }
}

Cypress.Commands.add('haveProperAriaAttributes', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).should('have.attr', 'aria-label');
  return cy.wrap(subject);
});

Cypress.Commands.add('beAccessible', { prevSubject: 'element' }, (subject) => {
  // Basic accessibility checks
  cy.wrap(subject).should('be.visible');
  cy.wrap(subject).should('not.have.attr', 'aria-hidden', 'true');
  return cy.wrap(subject);
});
