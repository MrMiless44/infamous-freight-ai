/**
 * Referral Service
 * Manages referral program and tracking
 */

const { v4: uuidv4 } = require('uuid');
const prisma = require('../lib/prisma');

class ReferralService {
  async generateReferralCode(userId) {
    try {
      const code = `REF_${userId.substring(0, 4).toUpperCase()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const referral = await prisma.referralCode.create({
        data: {
          code,
          userId,
          createdAt: new Date(),
          conversions: 0,
        },
      });

      return referral;
    } catch (err) {
      console.error('Generate referral code error:', err.message);
      throw err;
    }
  }

  async getReferralCode(userId) {
    try {
      let referral = await prisma.referralCode.findFirst({
        where: { userId },
      });

      if (!referral) {
        referral = await this.generateReferralCode(userId);
      }

      return referral;
    } catch (err) {
      console.error('Get referral code error:', err.message);
      throw err;
    }
  }

  async trackReferral(referralCode, newUserId) {
    try {
      const referral = await prisma.referralCode.findUnique({
        where: { code: referralCode },
      });

      if (!referral) {
        return null;
      }

      // Record the conversion
      await prisma.referralCode.update({
        where: { code: referralCode },
        data: { conversions: { increment: 1 } },
      });

      // Record the referral relationship
      await prisma.referralConversion.create({
        data: {
          referralCodeId: referral.id,
          referredUserId: newUserId,
          convertedAt: new Date(),
          reward: 'pending',
        },
      });

      return referral;
    } catch (err) {
      console.error('Track referral error:', err.message);
      throw err;
    }
  }

  async getReferralStats(userId) {
    try {
      const referral = await this.getReferralCode(userId);

      const conversions = await prisma.referralConversion.count({
        where: { referralCode: { userId } },
      });

      const rewards = await prisma.referralReward.findMany({
        where: { referralCodeId: referral.id },
      });

      const totalReward = rewards.reduce((sum, r) => sum + r.amount, 0);

      return {
        code: referral.code,
        conversions,
        rewards: {
          total: totalReward,
          list: rewards,
        },
        shareUrl: `${process.env.WEB_URL}/signup?ref=${referral.code}`,
      };
    } catch (err) {
      console.error('Get referral stats error:', err.message);
      throw err;
    }
  }

  async claimReferralReward(referralCode, amount) {
    try {
      const referral = await prisma.referralCode.findUnique({
        where: { code: referralCode },
      });

      if (!referral) {
        throw new Error('Invalid referral code');
      }

      const reward = await prisma.referralReward.create({
        data: {
          referralCodeId: referral.id,
          amount,
          claimedAt: new Date(),
          status: 'claimed',
        },
      });

      return reward;
    } catch (err) {
      console.error('Claim referral reward error:', err.message);
      throw err;
    }
  }

  getRewardTiers() {
    return [
      { referrals: 1, reward: 50, description: 'First referral: $50 credit' },
      { referrals: 5, reward: 250, description: 'Reach 5 referrals: $250 bonus' },
      { referrals: 10, reward: 500, description: 'Reach 10 referrals: $500 bonus' },
      { referrals: 25, reward: 2000, description: 'Reach 25 referrals: $2000 bonus' },
    ];
  }

  getReferralBenefit(tier) {
    const benefits = {
      basic: {
        title: 'Basic Plan',
        referralReward: '$50 per referral',
        friendReward: '$50 credit',
      },
      professional: {
        title: 'Professional Plan',
        referralReward: '$100 per referral',
        friendReward: '$100 credit',
      },
      enterprise: {
        title: 'Enterprise Plan',
        referralReward: 'Custom rewards',
        friendReward: 'Custom benefits',
      },
    };

    return benefits[tier] || benefits.basic;
  }
}

module.exports = new ReferralService();
