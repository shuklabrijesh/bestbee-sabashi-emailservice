const express = require('express');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const emailRoutes = require('./routes/emailRoutes');
const logger = require('./utils/logger');

const app = express();

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.trace(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  logger.trace('Health check endpoint called');
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', emailRoutes); // mounts /api/admin/email/send, /api/support/email/send, etc.

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.message}\n${err.stack}`);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

module.exports = app;
