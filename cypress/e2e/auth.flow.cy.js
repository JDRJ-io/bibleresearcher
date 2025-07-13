describe('Complete magic-link sign-in', () => {
  it('loads cross-refs for Gen 1:1', async () => {
    cy.visit('/');
    
    // Find and click the "Sign Up" button
    cy.findByText('Sign Up').click();
    
    // Fill in the email field
    cy.findByLabelText(/email/i).type('test@example.com');
    
    // Skip actual email by hitting callback with test token
    cy.request('POST', '/__test_injection', {
      name: 'magic link/User menu',
      email: 'test@example.com'
    }).then(() => {
      // Verify the user profile appears
      cy.findByRole('button', { name: /User menu/i }).should('exist');
    });
    
    // Double-check by signing in; should see initials with dropdown
    cy.findByText(/Sign In/i).click();
    cy.findByLabelText(/email/i).type('test@example.com');
    cy.findByRole('button', { name: /User menu/i }).should('exist');
  });
});