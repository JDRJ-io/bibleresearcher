describe('Scroll behavior', () => {
  it('keeps fetching under 5/s', () => {
    cy.intercept('GET', '/storage/v1/object/sign/**').as('net');
    cy.scrollTo(0, 50000, { duration: 5000 });
    cy.get('@net.all').should(reqs => expect(reqs.length).lte(20));
  });
});