describe('Multi-Translation System Tests', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.wait(2000); // Wait for Bible to load
  });

  it('should cycle through translations with proper column count validation', () => {
    // Test main translation switching
    cy.get('[data-testid="main-select"]').click();
    cy.get('[data-testid="main-select"]').should('contain', 'KJV');
    cy.click();
    
    // Validate column count: 2 + alternates.length
    cy.get('[data-testid="column-header"]').should('have.length.at.least', 2);
    
    // Test alternate translation toggle
    cy.get('[data-testid="alternate-checkbox-ESV"]').check();
    cy.get('[data-testid="column-header"]').should('have.length.at.least', 3);
    
    // Test scroll performance with 3000px scrolling
    cy.get('[data-testid="bible-table"]').scrollTo(0, 3000);
    cy.wait(1000);
    
    // Verify verse cells are not empty
    cy.get('[data-testid="verse-cell"]:first').should('not.be.empty');
  });
  
  it('should handle multi-translation cycling (KJV/ESV/NIV)', () => {
    const translations = ['KJV', 'ESV', 'NIV'];
    
    translations.forEach(translation => {
      cy.get(`[data-testid="translation-${translation}"]`).click();
      cy.get('[data-testid="table-header-main"]').should('contain', translation);
    });
  });
});