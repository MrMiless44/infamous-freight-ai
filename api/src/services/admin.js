/**
 * Admin Service
 * Manages admin operations like user management and payment handling
 */

const prisma = require('../lib/prisma');

class AdminService {
  async listUsers(filters = {}) {
    try {
      const { role, limit = 50, offset = 0, search } = filters;

      const where = {};
      if (role) where.role = role;
      if (search) {
        where.OR = [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ];
      }

      const users = await prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.user.count({ where });

      return { users, total, limit, offset };
    } catch (err) {
      console.error('List users error:', err.message);
      throw err;
    }
  }

  async updateUserRole(userId, newRole) {
    try {
      if (!['user', 'admin', 'moderator', 'suspended'].includes(newRole)) {
        throw new Error('Invalid role');
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      return user;
    } catch (err) {
      console.error('Update user role error:', err.message);
      throw err;
    }
  }

  async suspendUser(userId, reason) {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          role: 'suspended',
        },
      });

      // Log suspension
      console.log(`User ${userId} suspended. Reason: ${reason}`);

      return user;
    } catch (err) {
      console.error('Suspend user error:', err.message);
      throw err;
    }
  }

  async deleteUser(userId) {
    try {
      // Delete related data first
      await prisma.userOnboarding.deleteMany({
        where: { userId },
      });

      await prisma.referralCode.deleteMany({
        where: { userId },
      });

      const user = await prisma.user.delete({
        where: { id: userId },
      });

      return user;
    } catch (err) {
      console.error('Delete user error:', err.message);
      throw err;
    }
  }

  async getSystemStats() {
    try {
      const [totalUsers, totalShipments, totalDrivers, activeUsers] = await Promise.all([
        prisma.user.count(),
        prisma.shipment.count(),
        prisma.driver.count(),
        prisma.user.count({
          where: {
            role: { not: 'suspended' },
          },
        }),
      ]);

      const usersLastDay = await prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      });

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: usersLastDay,
        },
        shipments: {
          total: totalShipments,
        },
        drivers: {
          total: totalDrivers,
        },
        health: {
          status: totalUsers > 0 ? 'healthy' : 'initializing',
          timestamp: new Date(),
        },
      };
    } catch (err) {
      console.error('Get system stats error:', err.message);
      throw err;
    }
  }

  async batchOperationUsers(operation, userIds) {
    try {
      const results = [];

      for (const userId of userIds) {
        try {
          let result;

          switch (operation) {
            case 'suspend':
              result = await this.suspendUser(userId, 'Batch operation');
              break;
            case 'promote':
              result = await this.updateUserRole(userId, 'admin');
              break;
            case 'demote':
              result = await this.updateUserRole(userId, 'user');
              break;
            default:
              throw new Error('Unknown operation');
          }

          results.push({ userId, success: true, result });
        } catch (err) {
          results.push({ userId, success: false, error: err.message });
        }
      }

      return results;
    } catch (err) {
      console.error('Batch operation error:', err.message);
      throw err;
    }
  }

  async getPaymentDisputes() {
    try {
      // Mock data - would integrate with payment processor
      return {
        open: [],
        resolved: [],
        total: 0,
      };
    } catch (err) {
      console.error('Get payment disputes error:', err.message);
      throw err;
    }
  }

  async resolvePaymentDispute(disputeId, resolution) {
    try {
      // Mock resolution - would integrate with payment processor
      console.log(`Dispute ${disputeId} resolved with: ${resolution}`);

      return {
        disputeId,
        status: 'resolved',
        resolution,
        resolvedAt: new Date(),
      };
    } catch (err) {
      console.error('Resolve payment dispute error:', err.message);
      throw err;
    }
  }
}

module.exports = new AdminService();
