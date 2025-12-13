/**
 * Referral Routes
 * Endpoints for managing referral program
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.hybrid');
const rateLimit = require('../middleware/rateLimit');
const referral = require('../services/referral');
const crypto = require('crypto');

const router = express.Router();

const verifySignature = (code, newUserId, signature) => {
  const secret = process.env.REFERRAL_TRACKING_SECRET || '';
  if (!secret || !signature) return false;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${code}:${newUserId}`);
  const expected = Buffer.from(hmac.digest('hex'));
  const provided = Buffer.from(String(signature));

  // timingSafeEqual throws on length mismatch
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
};

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
router.post('/track', rateLimit({ points: 20, duration: 60 }), async (req, res) => {
  try {
    const { code, newUserId } = req.body;
    const signature = req.headers['x-referral-signature'];

    if (!code || !newUserId) {
      return res.status(400).json({ error: 'Code and newUserId are required' });
    }

    const signatureValid = verifySignature(code, newUserId, signature);
    const hasAuthHeader = !!(req.headers.authorization || req.headers['x-api-key']);

    if (!signatureValid && !hasAuthHeader) {
      return res.status(401).json({ error: 'Invalid referral signature' });
    }

    // If caller provides auth header, validate it; otherwise rely on signature check
    if (!signatureValid && hasAuthHeader) {
      const authPromise = new Promise((resolve, reject) => {
        authMiddleware(req, res, (err) => (err ? reject(err) : resolve(null)));
      });
      try {
        await authPromise;
      } catch {
        if (res.headersSent) return;
        return res.status(401).json({ error: 'Unauthorized referral tracking request' });
      }
    }

    const tracked = await referral.trackReferral(code, newUserId);

    if (!tracked) {
      return res.status(404).json({ error: 'Referral code not found' });
    }

    res.json({ success: true, tracked });
  } catch (err) {
    const conflictMessages = ['Referral already recorded for this user', 'Self-referrals are not allowed'];
    if (conflictMessages.includes(err.message)) {
      return res.status(409).json({ error: err.message });
    }
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
