// cypress/e2e/prophecy.cy.js
describe('Prophecy Columns', () => {
  it('shows prophecy rows', () => {
    cy.visit('/bible?ref=Gen.22');
    cy.findByText('Prediction').should('be.visible');  // header
    cy.findByText('Gen.22:8').should('exist');         // pred ref
  });
  
  it('handles verses with no prophecy entries', () => {
    cy.visit('/bible?ref=Gen.1');
    // Should show empty cells with "—" for verses without prophecy
    cy.get('[data-testid="prophecy-cell"]').should('contain', '—');
  });
});