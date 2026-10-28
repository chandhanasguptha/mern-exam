require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
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

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/applications', applicationRoutes);

// Welcome / Root endpoint
app.get('/', (req, res) => {
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

module.exports = { app, startServer };
