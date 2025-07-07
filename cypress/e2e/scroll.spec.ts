describe('Scroll behavior', () => {
  it('keeps fetching under 5/s', () => {
    cy.intercept('GET', '/api/storage/v1/object/sign/*', (req) => {
      cy.wrap(req).should('be.calledAtMost', 5);
    });
    
    cy.visit('/');
    cy.get('[data-testid="bible-table"]').scrollTo(0, 4000);
    cy.get('[data-testid="bible-table"]').scrollTo(0, 8000);
    cy.get('[data-testid="bible-table"]').scrollTo(0, { duration: 3000 });
    
    cy.get('[data-testid="bible-table"]').should('be.visible');
  });
});