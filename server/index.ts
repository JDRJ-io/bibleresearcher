import express from 'express';
import cors from 'cors';
import storageRoutes from './routes/storage.js';
import userRoutes from './routes/users.js';
import { registerStripeRoutes } from './routes/stripe.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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