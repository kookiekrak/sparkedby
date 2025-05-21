import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { handleWaitlistSignup } from './handlers/waitlist';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware with expanded CORS options
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.post('/api/waitlist', handleWaitlistSignup);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
