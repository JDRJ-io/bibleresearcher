describe('Auth Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should show auth buttons when logged out', () => {
    cy.get('[data-test-id="sign-in-button"]').should('be.visible');
    cy.get('[data-test-id="sign-up-button"]').should('be.visible');
  });

  it('should open sign in modal', () => {
    cy.get('[data-test-id="sign-in-button"]').click();
    cy.get('[data-test-id="sign-in-modal"]').should('be.visible');
  });

  it('should validate email input', () => {
    cy.get('[data-test-id="sign-in-button"]').click();
    cy.get('[data-test-id="email-input"]').type('invalid-email');
    cy.get('[data-test-id="submit-button"]').click();
    cy.get('[data-test-id="error-message"]').should('contain', 'Invalid email');
  });

  it('should send magic link on valid email', () => {
    cy.get('[data-test-id="sign-in-button"]').click();
    cy.get('[data-test-id="email-input"]').type('test@example.com');
    cy.get('[data-test-id="submit-button"]').click();
    cy.get('[data-test-id="success-message"]').should('contain', 'Magic link sent');
  });

  it('should persist session across reload', () => {
    // Mock authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('session', JSON.stringify({ user: { email: 'test@example.com' } }));
    });
    cy.reload();
    cy.get('[data-test-id="user-avatar"]').should('be.visible');
  });
});