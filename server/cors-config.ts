import cors from 'cors';

const allowedOrigins = new Set([
  'https://anointed.io',
  'https://www.anointed.io',
  'https://staging.anointed.io',
  ...(process.env.NODE_ENV === 'development' ? [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://0.0.0.0:5000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5000',
  ] : [])
]);

export const corsStrict = cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
});
