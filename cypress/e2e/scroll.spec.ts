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
});