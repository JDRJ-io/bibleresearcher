// cypress/e2e/crossref.cy.js
describe('Cross References', () => {
  it('shows cross refs', () => {
    cy.visit('/bible?ref=John.3');
    cy.findAllByText(/Num\./).first().should('be.visible');
  });
  
  it('loads cross-references without re-downloading files', () => {
    cy.intercept('GET', '**/references/**').as('refRequests');
    cy.visit('/bible?ref=Gen.1');
    cy.scrollTo('bottom');
    cy.scrollTo('top');
    
    // Should only see initial file downloads, no re-downloads
    cy.get('@refRequests').should('have.length.lessThan', 5);
  });
});