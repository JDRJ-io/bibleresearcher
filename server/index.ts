import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import storageRoutes from './routes/storage.js';
import userRoutes from './routes/users.js';
import { registerStripeRoutes } from './routes/stripe.js';

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

// Stripe payment routes
registerStripeRoutes(app);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});