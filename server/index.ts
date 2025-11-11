import * as Sentry from "@sentry/node";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { security } from './security';
import { corsStrict } from './cors-config';
import { apiLimiter, authLimiter } from './rate-limit';
import storageRoutes from './routes/storage.js';
import userRoutes from './routes/users.js';
import { registerStripeRoutes } from './routes/stripe.js';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import seoRoutes from './routes/seo';
import emailRoutes from './routes/email';
import supportRoutes from './routes/support';

// Initialize Sentry for backend error monitoring (production-ready)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    // Performance monitoring sample rate
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT as string) || 3001;

// Sentry request handler must be the first middleware on the app
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

// Security middleware (order matters!)
app.use(security);
app.use(corsStrict);
app.use(compression());
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '200kb' }));

// Static file serving for important documents
app.use('/important_docs', express.static(path.join(__dirname, '..', 'client', 'important_docs')));

// API Routes with rate limiting
app.use('/api/storage', apiLimiter, storageRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/profile', apiLimiter, profileRoutes);
app.use('/api/email', authLimiter, emailRoutes);
app.use('/api', apiLimiter, supportRoutes);

// Stripe payment routes
registerStripeRoutes(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Test endpoint to check if new routes are working
app.get('/api/test-auth', (req, res) => {
  res.json({ message: 'Auth endpoints are configured' });
});

// Sentry error handler must be before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

async function startServer() {
  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    root: path.resolve(__dirname, '..', 'client')
  });

  // CRITICAL: SEO routes MUST be registered before Vite middleware
  // This ensures robots.txt and sitemap.xml return proper content, not HTML
  app.use('/', seoRoutes);

  // Important: Add API routes BEFORE Vite middleware
  // This ensures API calls don't get intercepted by Vite
  
  // Use vite's connect instance as middleware for everything else
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);

  // Start the server
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api/`);
  });
}

startServer().catch(console.error);