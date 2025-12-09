/**
 * Feedback Route
 * Collects user feedback for product improvement
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

/**
 * POST /api/feedback
 * Submit user feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const { feedback, email } = req.body;

    if (!feedback || feedback.trim().length === 0) {
      return res.status(400).json({ error: 'Feedback cannot be empty' });
    }

    // Store feedback (you might want to add a Feedback model to Prisma)
    console.log('📝 New feedback received:', {
      email: email || 'anonymous',
      message: feedback,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
    });

    // Optional: Send to external service (e.g., email, Slack)
    if (process.env.FEEDBACK_EMAIL) {
      // Send email notification
      console.log(`📧 Would send feedback email to ${process.env.FEEDBACK_EMAIL}`);
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your feedback!',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
