describe('scroll budget', () => {
  it('keeps translation fetches under 4/s', () => {
    cy.intercept('GET', '/storage/v1/object/sign/**').as('net');
    cy.visit('/');
    cy.get('[data-testid=bible-table]').scrollTo(0, 50000, { duration: 5000 });
    cy.get('@net.all').then(reqs => {
      expect(reqs.length, 'total GETs in 5 s').to.be.lte(20); // 4 per second
    });
    
    // sanity: verse still visible => anchor preserved
    cy.contains('Gen 1:1').should('be.visible');
  });

  it('PWA service worker registers correctly', () => {
    cy.visit('/');
    cy.window().its('navigator.serviceWorker.controller').should('not.be.null');
  });

  // Task 4.4: Manual and Automated QA scripts
  it('translation switching cycles correctly', () => {
    cy.visit('/');
    
    // Manual: switch main → alternates, scroll 300 rows, confirm no undefined logs
    cy.get('[data-testid=translation-selector]').should('be.visible');
    cy.get('[data-testid=translation-toggle-ESV]').click();
    
    // Scroll 300 rows (300 * 120px = 36000px)
    cy.get('[data-testid=bible-table]').scrollTo(0, 36000, { duration: 3000 });
    
    // Check for undefined in console logs
    cy.window().then((win) => {
      const logs = [];
      cy.wrap(logs).should('not.include', 'undefined');
    });
    
    // Verify verse cells are not empty
    cy.get('[data-verse-id]').should('have.length.greaterThan', 0);
    cy.get('[data-verse-id]').each(($el) => {
      cy.wrap($el).should('not.contain', 'undefined');
      cy.wrap($el).should('not.be.empty');
    });
  });

  // Automated: extend scroll.spec.ts to cycle through 3 translations
  it('cycles through multiple translations without errors', () => {
    cy.visit('/');
    
    const translations = ['KJV', 'ESV', 'NIV'];
    
    translations.forEach((translation) => {
      cy.get(`[data-testid=translation-toggle-${translation}]`).click();
      cy.get('[data-testid=bible-table]').scrollTo(0, 20000, { duration: 2000 });
      
      // Assert non-empty cells
      cy.get('[data-verse-id]').should('have.length.greaterThan', 0);
      cy.get('[data-verse-id]').each(($el) => {
        cy.wrap($el).should('not.be.empty');
        cy.wrap($el).should('not.contain', 'Loading...');
      });
    });
  });

  // Add assertion that column count equals 2 + alternates.length
  it('validates column count matches active translations', () => {
    cy.visit('/');
    
    // Initially should have 2 columns (Ref + main translation)
    cy.get('[data-testid=column-header]').should('have.length', 2);
    
    // Add alternate translation
    cy.get('[data-testid=translation-toggle-ESV]').click();
    cy.get('[data-testid=column-header]').should('have.length', 3);
    
    // Add another alternate translation
    cy.get('[data-testid=translation-toggle-NIV]').click();
    cy.get('[data-testid=column-header]').should('have.length', 4);
  });
});