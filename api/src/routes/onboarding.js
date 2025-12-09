/**
 * Onboarding Routes
 * Endpoints for managing user onboarding flow
 */

const express = require('express');
const authMiddleware = require('../middleware/auth.hybrid');
const onboarding = require('../services/onboarding');

const router = express.Router();

// Initialize onboarding for user
router.post('/init', authMiddleware, async (req, res) => {
  try {
    const onboardingData = await onboarding.initializeUserOnboarding(req.user.id);
    res.json({ success: true, onboarding: onboardingData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get current onboarding status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const status = await onboarding.getOnboardingStatus(req.user.id);
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark a step as complete
router.post('/complete-step', authMiddleware, async (req, res) => {
  try {
    const { step } = req.body;

    if (!step) {
      return res.status(400).json({ error: 'Step is required' });
    }

    const updated = await onboarding.markStepComplete(req.user.id, step);
    const status = await onboarding.getOnboardingStatus(req.user.id);
    const nextStep = await onboarding.getNextRecommendedStep(req.user.id);

    res.json({
      success: true,
      onboarding: updated,
      status,
      nextStep,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get next recommended step
router.get('/next-step', authMiddleware, async (req, res) => {
  try {
    const nextStep = await onboarding.getNextRecommendedStep(req.user.id);
    const tips = nextStep ? onboarding.getStepTips(nextStep) : null;

    res.json({
      success: true,
      nextStep,
      tips,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tips for a specific step
router.get('/tips/:step', authMiddleware, (req, res) => {
  try {
    const { step } = req.params;
    const tips = onboarding.getStepTips(step);

    if (!tips) {
      return res.status(404).json({ error: 'Step not found' });
    }

    res.json({ success: true, tips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
