/**
 * Onboarding Service
 * Manages user onboarding flow and tracking
 */

const prisma = require('../lib/prisma');
const STEPS = [
  'profile_complete',
  'payment_added',
  'first_shipment',
  'integration_setup',
];

class OnboardingService {
  async initializeUserOnboarding(userId) {
    try {
      // Create onboarding record (idempotent for existing users)
      const onboarding = await prisma.userOnboarding.upsert({
        where: { userId },
        update: {},
        create: {
          userId,
          completedSteps: [],
          startedAt: new Date(),
        },
      });

      return onboarding;
    } catch (err) {
      console.error('Onboarding initialization error:', err.message);
      throw err;
    }
  }

  async markStepComplete(userId, step) {
    try {
      const onboarding = await prisma.userOnboarding.findUnique({
        where: { userId },
      });

      if (!onboarding) {
        return this.initializeUserOnboarding(userId);
      }

      const completedSteps = onboarding.completedSteps || [];
      if (!completedSteps.includes(step)) {
        completedSteps.push(step);
      }

      const updated = await prisma.userOnboarding.update({
        where: { userId },
        data: { completedSteps },
      });

      return updated;
    } catch (err) {
      console.error('Mark step complete error:', err.message);
      throw err;
    }
  }

  async getOnboardingStatus(userId) {
    try {
      const onboarding =
        (await prisma.userOnboarding.findUnique({ where: { userId } })) ||
        (await this.initializeUserOnboarding(userId));

      const progress = onboarding.completedSteps?.length || 0;
      const percentage = Math.round((progress / STEPS.length) * 100);

      return {
        completedSteps: onboarding.completedSteps || [],
        allSteps: STEPS,
        progress: percentage,
        isComplete: progress === STEPS.length,
      };
    } catch (err) {
      console.error('Get onboarding status error:', err.message);
      throw err;
    }
  }

  async getNextRecommendedStep(userId) {
    try {
      const status = await this.getOnboardingStatus(userId);

      for (const step of STEPS) {
        if (!status.completedSteps.includes(step)) {
          return step;
        }
      }

      return null; // All steps complete
    } catch (err) {
      console.error('Get next recommended step error:', err.message);
      throw err;
    }
  }

  getStepTips(step) {
    const tips = {
      profile_complete: {
        title: 'Complete Your Profile',
        description: 'Add your company information and contact details',
        tips: [
          'Upload your company logo',
          'Add billing address',
          'Set up notification preferences',
        ],
      },
      payment_added: {
        title: 'Add Payment Method',
        description: 'Add a credit card or bank account for billing',
        tips: [
          'Credit cards are processed instantly',
          'All payments are secure and encrypted',
          'You can manage multiple payment methods',
        ],
      },
      first_shipment: {
        title: 'Create Your First Shipment',
        description: 'Create and submit your first shipment',
        tips: [
          'Fill in pickup and delivery locations',
          'Specify package details and weight',
          'Request quotes from drivers',
        ],
      },
      integration_setup: {
        title: 'Set Up Integrations',
        description: 'Connect with your existing tools',
        tips: [
          'Use our API for automated shipment creation',
          'Connect with Zapier for workflows',
          'Export data as CSV for reporting',
        ],
      },
    };

    return tips[step] || null;
  }
}

module.exports = new OnboardingService();
