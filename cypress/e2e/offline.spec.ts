/// <reference types="cypress" />

describe('Offline functionality', () => {
  it('should show offline status when network is disabled', () => {
    cy.visit('/');
    
    // Simulate going offline
    cy.exec('npm run offline'); // or Chrome DevTools offline
    
    // Verify offline status is shown
    cy.get('[data-testid="connectivity-status"]').should('contain', 'Offline');
  });

  it('should allow notes to be saved offline', () => {
    cy.visit('/');
    cy.exec('npm run offline');
    
    // Try to save a note while offline
    cy.get('[data-testid="verse-row"]').first().dblclick();
    cy.get('[data-testid="note-input"]').type('Test offline note');
    cy.get('[data-testid="save-note"]').click();
    
    // Should save locally and show pending status
    cy.get('[data-testid="note-status"]').should('contain', 'pending');
  });
});