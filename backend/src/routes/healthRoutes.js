const express = require('express');
const router = express.Router();
const { getDatabaseStatus } = require('../config/db');

router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();
  const isDbConnected = dbStatus.state === 'connected';

  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    message: isDbConnected ? 'System is healthy and database is connected' : 'Database connection not ready',
    data: {
      status: isDbConnected ? 'UP' : 'DOWN',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: dbStatus
    }
  });
});

module.exports = router;
