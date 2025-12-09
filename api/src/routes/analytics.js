/**
 * Analytics Routes
 * Endpoints for analytics and metrics
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.hybrid');
const analytics = require('../services/analytics');

const router = express.Router();

// Get user retention metrics
router.get('/retention', authMiddleware, async (req, res) => {
  try {
    const days = req.query.days || 30;
    const metrics = await analytics.getUserRetentionMetrics(parseInt(days));
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get cohort analysis
router.get('/cohort/:date', authMiddleware, async (req, res) => {
  try {
    const { date } = req.params;
    const cohort = await analytics.getCohortAnalysis(date);
    res.json({ success: true, cohort });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get revenue metrics
router.get('/revenue', authMiddleware, async (req, res) => {
  try {
    const days = req.query.days || 30;
    const metrics = await analytics.getRevenueMetrics(parseInt(days));
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get feature adoption metrics
router.get('/adoption', authMiddleware, async (req, res) => {
  try {
    const metrics = await analytics.getFeatureAdoptionMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get customer health score
router.get('/health/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is admin or owner
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const health = await analytics.getCustomerHealthScore(userId);
    res.json({ success: true, health });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get dashboard metrics
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const metrics = await analytics.getDashboardMetrics();
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
