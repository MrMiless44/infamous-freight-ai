/**
 * Analytics Service
 * Tracks and provides analytics metrics for dashboards
 */

const prisma = require('../lib/prisma');

class AnalyticsService {
  async getUserRetentionMetrics(days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const newUsers = await prisma.user.count({
        where: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      });

      const totalUsers = await prisma.user.count();

      const activeUsers = await prisma.shipment.findMany({
        where: {
          createdAt: {
            gte: cutoffDate,
          },
        },
        select: {
          id: true,
        },
        distinct: ['createdAt'],
      });

      const retentionRate =
        totalUsers > 0 ? ((newUsers / totalUsers) * 100).toFixed(2) : '0.00';

      return {
        period: `${days} days`,
        newUsers,
        totalUsers,
        retentionRate,
        activeCount: activeUsers.length,
      };
    } catch (err) {
      console.error('User retention metrics error:', err.message);
      throw err;
    }
  }

  async getCohortAnalysis(cohortDate) {
    try {
      const cohortStart = new Date(cohortDate);
      const cohortEnd = new Date(cohortStart);
      cohortEnd.setDate(cohortEnd.getDate() + 1);

      const cohortUsers = await prisma.user.findMany({
        where: {
          createdAt: {
            gte: cohortStart,
            lt: cohortEnd,
          },
        },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });

      const shipmentsByUser = await Promise.all(
        cohortUsers.map(async (user) => {
          const shipments = await prisma.shipment.count({
            where: {
              createdAt: {
                gte: user.createdAt,
              },
            },
          });
          return { userId: user.id, shipmentCount: shipments };
        })
      );

      const avgShipments = shipmentsByUser.reduce((sum, u) => sum + u.shipmentCount, 0) / cohortUsers.length;

      return {
        cohortDate: cohortDate,
        usersInCohort: cohortUsers.length,
        avgShipmentsPerUser: avgShipments.toFixed(2),
        activeUsers: shipmentsByUser.filter((u) => u.shipmentCount > 0).length,
      };
    } catch (err) {
      console.error('Cohort analysis error:', err.message);
      throw err;
    }
  }

  async getRevenueMetrics(days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Mock revenue data - would connect to payment service in production
      const totalRevenue = await prisma.shipment.count({
        where: {
          createdAt: {
            gte: cutoffDate,
          },
        },
      });

      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const revenuePerUser =
        users.length > 0 ? (totalRevenue / users.length).toFixed(2) : '0.00';

      return {
        period: `${days} days`,
        estimatedRevenue: (totalRevenue * 25).toFixed(2), // Assuming avg $25 per shipment
        shipmentsProcessed: totalRevenue,
        revenuePerUser,
        avgRevenuePerUser: revenuePerUser,
      };
    } catch (err) {
      console.error('Revenue metrics error:', err.message);
      throw err;
    }
  }

  async getFeatureAdoptionMetrics() {
    try {
      const totalUsers = await prisma.user.count();

      const shipmentUsers = await prisma.user.count({
        where: {
          // Would filter by users who have created shipments
        },
      });

      const driverUsers = await prisma.driver.count();
      const safeTotal = totalUsers || 1; // avoid division by zero for mock percentages

      return {
        totalUsers,
        shipmentsFeatureAdoption: ((shipmentUsers / safeTotal) * 100).toFixed(2),
        driversAdopted: driverUsers,
        features: {
          shipments: {
            adoption: '85%',
            users: shipmentUsers,
          },
          drivers: {
            adoption: '45%',
            users: driverUsers,
          },
          analytics: {
            adoption: '60%',
            users: Math.round(totalUsers * 0.6),
          },
          integrations: {
            adoption: '30%',
            users: Math.round(totalUsers * 0.3),
          },
        },
      };
    } catch (err) {
      console.error('Feature adoption metrics error:', err.message);
      throw err;
    }
  }

  async getCustomerHealthScore(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        return null;
      }

      const shipmentsCount = await prisma.shipment.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          },
        },
      });

      const daysSinceSignup = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate health score (0-100)
      let score = 50; // Base score

      if (shipmentsCount > 0) score += 20;
      if (shipmentsCount > 5) score += 15;
      if (daysSinceSignup > 30) score += 15;

      const health = score >= 75 ? 'excellent' : score >= 50 ? 'good' : 'at-risk';

      return {
        userId,
        score,
        health,
        shipmentsLast90Days: shipmentsCount,
        daysSinceSignup,
        recommendations: this.getHealthRecommendations(health),
      };
    } catch (err) {
      console.error('Customer health score error:', err.message);
      throw err;
    }
  }

  getHealthRecommendations(health) {
    const recommendations = {
      excellent: [
        'Continue engagement with feature updates',
        'Consider for testimonial/case study',
        'Upsell opportunities',
      ],
      good: [
        'Monitor for changes',
        'Share new features',
        'Offer discounts on volume',
      ],
      'at-risk': [
        'Schedule check-in call',
        'Offer personalized support',
        'Special re-engagement offer',
      ],
    };

    return recommendations[health] || [];
  }

  async getDashboardMetrics() {
    try {
      const [retention, revenue, adoption] = await Promise.all([
        this.getUserRetentionMetrics(30),
        this.getRevenueMetrics(30),
        this.getFeatureAdoptionMetrics(),
      ]);

      return {
        retention,
        revenue,
        adoption,
        lastUpdated: new Date(),
      };
    } catch (err) {
      console.error('Dashboard metrics error:', err.message);
      throw err;
    }
  }
}

module.exports = new AnalyticsService();
