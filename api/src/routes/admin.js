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

/**
 * Admin Management Routes
 * User management, payment handling, and system administration
 */

const adminService = require('../services/admin');

// List users
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const filters = {
      role: req.query.role,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      search: req.query.search,
    };

    const result = await adminService.listUsers(filters);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role
router.patch('/users/:userId/role', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const user = await adminService.updateUserRole(userId, role);
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Suspend user
router.post('/users/:userId/suspend', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body || {};

    const user = await adminService.suspendUser(userId, reason || 'No reason provided');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
router.delete('/users/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;

    // Prevent deleting own account
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await adminService.deleteUser(userId);
    res.json({ success: true, deleted: user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get system stats
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const stats = await adminService.getSystemStats();
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch operations on users
router.post('/users/batch/:operation', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { operation } = req.params;
    const { userIds } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'UserIds array is required' });
    }

    const results = await adminService.batchOperationUsers(operation, userIds);
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment disputes
router.get('/disputes', authMiddleware, adminOnly, async (req, res) => {
  try {
    const disputes = await adminService.getPaymentDisputes();
    res.json({ success: true, disputes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Resolve payment dispute
router.post('/disputes/:disputeId/resolve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({ error: 'Resolution is required' });
    }

    const result = await adminService.resolvePaymentDispute(disputeId, resolution);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
