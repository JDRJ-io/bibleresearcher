// 5—Regression test snippets (Cypress)

describe('Translation column switching', () => {
  it('should maintain column count when switching main translation', () => {
    cy.visit('/');
    
    // swap main ~ column count remains
    cy.get('[data-test=table-header]').then(h => {
      const before = h.length;
      cy.contains('radio', 'ESV').click();
      cy.get('[data-test=table-header]').should('have.length', before);
    });
  });

  it('should add column when toggling alternate ON', () => {
    cy.visit('/');
    
    // toggle alternate ON → +1 column, fetch fires  
    cy.intercept('/translations/NIV.json').as('niv');
    cy.contains('label', 'NIV').click();
    cy.wait('@niv');
    cy.get('[data-test=table-header]').its('length').should('eq', 3); // Reference + main + ESV
  });
});