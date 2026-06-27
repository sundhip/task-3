import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import taskRouter from './src/routes/taskRoutes.js';
import { securityHeaders } from './src/middleware/security.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware pipeline
app.use(helmet()); // Enable Helmet for secure HTTP headers
app.use(securityHeaders); // Custom security headers middleware
app.use(cors()); // Enable CORS for cross-origin requests
app.use(morgan('dev')); // HTTP request logging
app.use(express.json()); // Parse JSON request bodies

// Rate limiting middleware
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later.' }
}));

// Routes
app.use('/api/tasks', taskRouter);
app.use('/api/v1/tasks', taskRouter);

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TaskFlow API running on port ${PORT}`);
});
export default app; // export for testing purposes
