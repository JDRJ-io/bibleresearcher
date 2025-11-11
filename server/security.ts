import helmet from 'helmet';

const isProduction = process.env.NODE_ENV === 'production';

export const security = helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "default-src": ["'self'"],
      "script-src": ["'self'", "https://plausible.io", "https://js.stripe.com"],
      "style-src": ["'self'", "'unsafe-inline'"],
      "img-src": ["'self'", "data:", "blob:", "https://*.supabase.co"],
      "font-src": ["'self'", "data:"],
      "connect-src": [
        "'self'",
        process.env.VITE_SUPABASE_URL ?? "",
        "https://*.supabase.co",
        "https://plausible.io",
        "https://api.stripe.com",
        "https://js.stripe.com",
        "https://*.sentry.io"
      ],
      "frame-src": ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      "frame-ancestors": ["'none'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "upgrade-insecure-requests": isProduction ? [] : null
    }
  },
  strictTransportSecurity: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  frameguard: { action: "deny" },
  noSniff: true,
  xssFilter: true,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
  dnsPrefetchControl: { allow: true }
});
