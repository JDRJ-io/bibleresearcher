import React from 'react';

const Footer = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center space-x-4 mb-2 sm:mb-0">
            <a 
              href="/docs/acknowledgments" 
              className="hover:text-foreground transition-colors"
            >
              Acknowledgments
            </a>
            <a 
              href="/docs/privacy-policy" 
              className="hover:text-foreground transition-colors"
            >
              Privacy Policy
            </a>
            <a 
              href="/docs/policies" 
              className="hover:text-foreground transition-colors"
            >
              Policies
            </a>
            <a 
              href="/docs/tos" 
              className="hover:text-foreground transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="/docs/donate" 
              className="hover:text-foreground transition-colors"
            >
              Donate
            </a>
            <a 
              href="/docs" 
              className="hover:text-foreground transition-colors font-medium"
            >
              All Documents
            </a>
          </div>
          <div className="text-center sm:text-right">
            © 2025 Anointed.io
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;