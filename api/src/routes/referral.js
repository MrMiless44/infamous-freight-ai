/**
 * Referral Routes
 * Endpoints for managing referral program
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.hybrid');
const referral = require('../services/referral');

const router = express.Router();

// Get user's referral code
router.get('/code', authMiddleware, async (req, res) => {
  try {
    const code = await referral.getReferralCode(req.user.id);
    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get referral statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await referral.getReferralStats(req.user.id);
    res.json({ success: true, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Track a referral conversion
router.post('/track', async (req, res) => {
  try {
    const { code, newUserId } = req.body;

    if (!code || !newUserId) {
      return res.status(400).json({ error: 'Code and newUserId are required' });
    }

    const tracked = await referral.trackReferral(code, newUserId);

    if (!tracked) {
      return res.status(404).json({ error: 'Referral code not found' });
    }

    res.json({ success: true, tracked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim referral reward
router.post('/claim-reward', authMiddleware, async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code || !amount) {
      return res.status(400).json({ error: 'Code and amount are required' });
    }

    const reward = await referral.claimReferralReward(code, amount);
    res.json({ success: true, reward });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get reward tiers
router.get('/tiers', (req, res) => {
  try {
    const tiers = referral.getRewardTiers();
    res.json({ success: true, tiers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get referral benefits for plan
router.get('/benefits/:tier', (req, res) => {
  try {
    const { tier } = req.params;
    const benefits = referral.getReferralBenefit(tier);
    res.json({ success: true, benefits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
