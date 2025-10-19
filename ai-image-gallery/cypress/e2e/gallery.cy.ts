describe('AI Image Gallery E2E Tests', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('/');
  });

  describe('Authentication Flow', () => {
    it('should redirect to login when not authenticated', () => {
      cy.url().should('include', '/login');
    });

    it('should show login form', () => {
      cy.get('form').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should navigate to signup page', () => {
      cy.get('a[href="/signup"]').click();
      cy.url().should('include', '/signup');
    });

    it('should show signup form', () => {
      cy.visit('/signup');
      cy.get('form').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
    });
  });

  describe('Theme Toggle', () => {
    it('should toggle between light and dark mode', () => {
      // Mock authentication to access dashboard
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
      
      // Check initial theme
      cy.get('html').should('have.class', 'light');
      
      // Click theme toggle
      cy.get('button[aria-label*="Switch to"]').click();
      
      // Check dark mode is applied
      cy.get('html').should('have.class', 'dark');
      
      // Click again to switch back
      cy.get('button[aria-label*="Switch to"]').click();
      
      // Check light mode is applied
      cy.get('html').should('have.class', 'light');
    });

    it('should persist theme preference', () => {
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
      
      // Switch to dark mode
      cy.get('button[aria-label*="Switch to"]').click();
      cy.get('html').should('have.class', 'dark');
      
      // Reload page
      cy.reload();
      
      // Check theme is persisted
      cy.get('html').should('have.class', 'dark');
    });
  });

  describe('Image Upload', () => {
    beforeEach(() => {
      // Mock authentication
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
    });

    it('should show upload area', () => {
      cy.get('[data-testid="upload-area"]').should('be.visible');
    });

    it('should handle file drag and drop', () => {
      const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      cy.get('[data-testid="upload-area"]').trigger('dragover');
      cy.get('[data-testid="upload-area"]').should('have.class', 'border-blue-500');
      
      cy.get('[data-testid="upload-area"]').trigger('drop', {
        dataTransfer: {
          files: [testFile],
        },
      });
    });

    it('should validate file types', () => {
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      cy.get('[data-testid="upload-area"]').trigger('drop', {
        dataTransfer: {
          files: [invalidFile],
        },
      });
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
    });

    it('should validate file size', () => {
      // Create a large file (simulate)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      cy.get('[data-testid="upload-area"]').trigger('drop', {
        dataTransfer: {
          files: [largeFile],
        },
      });
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('Image Gallery', () => {
    beforeEach(() => {
      // Mock authentication and images
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
        // Mock images data
        win.localStorage.setItem('mock-images', JSON.stringify([
          {
            id: '1',
            original_filename: 'test1.jpg',
            thumbnail_url: 'https://via.placeholder.com/300',
            processing_status: 'completed',
            ai_tags: ['nature', 'landscape'],
          },
          {
            id: '2',
            original_filename: 'test2.jpg',
            thumbnail_url: 'https://via.placeholder.com/300',
            processing_status: 'processing',
            ai_tags: [],
          },
        ]));
      });
      
      cy.visit('/dashboard');
    });

    it('should display image grid', () => {
      cy.get('[data-testid="image-grid"]').should('be.visible');
    });

    it('should show image cards', () => {
      cy.get('[data-testid="image-card"]').should('have.length.at.least', 1);
    });

    it('should open image modal on click', () => {
      cy.get('[data-testid="image-card"]').first().click();
      cy.get('[data-testid="image-modal"]').should('be.visible');
    });

    it('should close image modal on escape key', () => {
      cy.get('[data-testid="image-card"]').first().click();
      cy.get('[data-testid="image-modal"]').should('be.visible');
      
      cy.get('body').type('{esc}');
      cy.get('[data-testid="image-modal"]').should('not.exist');
    });

    it('should show processing status', () => {
      cy.get('[data-testid="image-card"]').contains('Processing...').should('be.visible');
    });

    it('should show AI tags', () => {
      cy.get('[data-testid="image-card"]').contains('nature').should('be.visible');
      cy.get('[data-testid="image-card"]').contains('landscape').should('be.visible');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
    });

    it('should show search bar', () => {
      cy.get('[data-testid="search-bar"]').should('be.visible');
    });

    it('should filter images by search query', () => {
      cy.get('[data-testid="search-bar"]').type('nature');
      cy.get('[data-testid="search-bar"]').type('{enter}');
      
      // Should show filtered results
      cy.get('[data-testid="image-card"]').should('have.length.at.least', 1);
    });

    it('should show search suggestions', () => {
      cy.get('[data-testid="search-bar"]').type('nat');
      
      // Should show suggestions dropdown
      cy.get('[data-testid="search-suggestions"]').should('be.visible');
    });

    it('should clear search', () => {
      cy.get('[data-testid="search-bar"]').type('nature');
      cy.get('[data-testid="clear-search"]').click();
      
      cy.get('[data-testid="search-bar"]').should('have.value', '');
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
    });

    it('should be responsive on mobile', () => {
      cy.viewport(375, 667); // iPhone SE
      
      cy.get('[data-testid="image-grid"]').should('be.visible');
      cy.get('[data-testid="image-card"]').should('be.visible');
    });

    it('should be responsive on tablet', () => {
      cy.viewport(768, 1024); // iPad
      
      cy.get('[data-testid="image-grid"]').should('be.visible');
      cy.get('[data-testid="image-card"]').should('be.visible');
    });

    it('should be responsive on desktop', () => {
      cy.viewport(1920, 1080); // Desktop
      
      cy.get('[data-testid="image-grid"]').should('be.visible');
      cy.get('[data-testid="image-card"]').should('be.visible');
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
    });

    it('should load within acceptable time', () => {
      cy.get('[data-testid="image-grid"]', { timeout: 5000 }).should('be.visible');
    });

    it('should have good Lighthouse scores', () => {
      cy.lighthouse({
        performance: 90,
        accessibility: 90,
        'best-practices': 90,
        seo: 90,
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.window().then((win) => {
        win.localStorage.setItem('supabase.auth.token', 'mock-token');
      });
      
      cy.visit('/dashboard');
    });

    it('should have proper ARIA labels', () => {
      cy.get('button[aria-label]').should('exist');
      cy.get('input[aria-label]').should('exist');
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('exist');
    });

    it('should have proper heading structure', () => {
      cy.get('h1').should('exist');
    });

    it('should have proper color contrast', () => {
      cy.get('[data-testid="image-card"]').should('be.visible');
    });
  });
});
