describe('Auth Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should show auth buttons when logged out', () => {
    cy.get('[data-testid="sign-in-button"]').should('be.visible');
    cy.get('[data-testid="sign-up-button"]').should('be.visible');
  });

  it('should open sign in modal', () => {
    cy.get('[data-testid="sign-in-button"]').click();
    cy.get('[data-testid="sign-in-modal"]').should('be.visible');
  });

  it('should validate email input', () => {
    cy.get('[data-testid="sign-in-button"]').click();
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="submit-button"]').click();
    cy.get('[data-testid="error-message"]').should('contain', 'Invalid email');
  });

  it('should send magic link on valid email', () => {
    cy.get('[data-testid="sign-in-button"]').click();
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="submit-button"]').click();
    cy.get('[data-testid="success-message"]').should('contain', 'Magic link sent');
  });

  it('should persist session across reload', () => {
    // Mock authenticated state
    cy.window().then((win) => {
      win.localStorage.setItem('session', JSON.stringify({ user: { email: 'test@example.com' } }));
    });
    cy.reload();
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });
});