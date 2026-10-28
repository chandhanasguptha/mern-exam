require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const applicationRoutes = require('./routes/applicationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for client
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Logger (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Database connection assurance for serverless environments and cold starts
app.use(async (req, res, next) => {
  // Allow health check endpoint to always respond immediately without blocking
  if (req.path === '/api/health' || req.path === '/health') {
    return next();
  }

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: err.message || 'Database connection unavailable',
        data: null
      });
    }
  }
  next();
});

// Routes (supporting both /api prefix from Vercel rewrites and root mounting)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

app.use('/api/applications', applicationRoutes);
app.use('/applications', applicationRoutes);

// Welcome / Root endpoint
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Job Application Tracker API is running',
    data: {
      healthCheck: '/api/health',
      applications: '/api/applications',
      documentation: 'See README.md for endpoint specifications'
    }
  });
});

// 404 and Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server function (supports programmatic start for tests)
let serverInstance = null;

async function startServer() {
  await connectDB();
  return new Promise((resolve) => {
    serverInstance = app.listen(PORT, () => {
      console.log(`[Server] Job Application Tracker API running on http://localhost:${PORT}`);
      resolve(serverInstance);
    });
  });
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('[Server] Fatal startup error:', err);
    process.exit(1);
  });
}

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
