import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import storageRoutes from './routes/storage.js';
import userRoutes from './routes/users.js';
import { registerStripeRoutes } from './routes/stripe.js';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving for important documents
app.use('/important_docs', express.static(path.join(__dirname, '..', 'client', 'important_docs')));

// Routes
app.use('/api/storage', storageRoutes);
app.use('/api/users', userRoutes);
app.use(authRoutes);
app.use(profileRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});