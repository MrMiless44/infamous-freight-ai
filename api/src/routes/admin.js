/**
 * Admin Metrics Route
 * Real-time application metrics and health monitoring
 */

const express = require('express');
const router = express.Router();
const metricsService = require('../services/metrics');
const authMiddleware = require('../middleware/auth.hybrid');

// Verify admin access
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * GET /api/admin/metrics
 * Real-time application metrics
 */
router.get('/metrics', authMiddleware, adminOnly, async (req, res) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/health/full
 * Detailed health status with all checks
 */
router.get('/health/full', async (req, res) => {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'unknown',
      cache: 'unknown',
    };

    // Database check
    try {
      const prisma = require('../lib/prisma');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'connected';
    } catch {
      checks.database = 'disconnected';
    }

    // Cache check (if enabled)
    if (process.env.REDIS_URL) {
      try {
        const cacheService = require('../services/cache');
        await cacheService.get('health-check');
        checks.cache = 'connected';
      } catch {
        checks.cache = 'disconnected';
      }
    }

    res.json(checks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/metrics/reset
 * Reset metrics counters (admin only)
 */
router.post('/metrics/reset', authMiddleware, adminOnly, (req, res) => {
  metricsService.reset();
  res.json({ message: 'Metrics reset', timestamp: new Date().toISOString() });
});

module.exports = router;
