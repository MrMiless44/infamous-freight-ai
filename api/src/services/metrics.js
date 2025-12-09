/**
 * Metrics Service
 * Tracks application metrics: payments, users, errors, performance
 */

const prisma = require('../lib/prisma');

class MetricsService {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      payments: 0,
      paymentVolume: 0,
      startTime: new Date(),
    };
  }

  recordRequest() {
    this.metrics.requests++;
  }

  recordError() {
    this.metrics.errors++;
  }

  recordPayment(amount) {
    this.metrics.payments++;
    this.metrics.paymentVolume += amount;
  }

  async getMetrics() {
    const uptime = (Date.now() - this.metrics.startTime) / 1000;

    try {
      const userCount = await prisma.user.count();
      const driverCount = await prisma.user.count({
        where: { role: 'driver' },
      });
      const totalPayments = await prisma.payment.count({
        where: { status: 'completed' },
      });
      const totalRevenue = await prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
      });

      return {
        timestamp: new Date().toISOString(),
        uptime: Math.floor(uptime),
        server: {
          requests: this.metrics.requests,
          errors: this.metrics.errors,
          errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
        },
        users: {
          total: userCount,
          drivers: driverCount,
          customers: userCount - driverCount,
        },
        payments: {
          completed: totalPayments,
          volume: this.metrics.paymentVolume,
          revenue: totalRevenue._sum.amount || 0,
          averageTransaction: totalPayments > 0 ? (totalRevenue._sum.amount / totalPayments).toFixed(2) : 0,
        },
        health: {
          status: this.metrics.errors < this.metrics.requests * 0.05 ? 'healthy' : 'degraded',
          requestsPerSecond: (this.metrics.requests / (uptime || 1)).toFixed(2),
        },
      };
    } catch (err) {
      console.error('Metrics collection error:', err.message);
      return {
        timestamp: new Date().toISOString(),
        error: err.message,
      };
    }
  }

  reset() {
    this.metrics = {
      requests: 0,
      errors: 0,
      payments: 0,
      paymentVolume: 0,
      startTime: new Date(),
    };
  }
}

module.exports = new MetricsService();
