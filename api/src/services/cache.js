/**
 * Redis Caching Service
 * Handles response caching and performance optimization
 */

const redis = require('ioredis');

class CacheService {
  constructor() {
    this.client = null;
    this.enabled = !!process.env.REDIS_URL;
  }

  async initialize() {
    if (!this.enabled) {
      console.warn('⚠️  REDIS_URL not configured. Caching disabled.');
      return;
    }

    try {
      this.client = new redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3,
      });

      this.client.on('connect', () => {
        console.log('✅ Redis cache connected');
      });

      this.client.on('error', (err) => {
        console.error('❌ Redis error:', err.message);
      });

      await this.client.ping();
    } catch (err) {
      console.error('⚠️  Failed to initialize Redis:', err.message);
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled || !this.client) return null;

    try {
      const cached = await this.client.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (err) {
      console.error('Cache get error:', err.message);
      return null;
    }
  }

  async set(key, value, ttl = 3600) {
    if (!this.enabled || !this.client) return false;

    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.error('Cache set error:', err.message);
      return false;
    }
  }

  async invalidate(pattern) {
    if (!this.enabled || !this.client) return false;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      return true;
    } catch (err) {
      console.error('Cache invalidate error:', err.message);
      return false;
    }
  }

  async flush() {
    if (!this.enabled || !this.client) return false;

    try {
      await this.client.flushdb();
      return true;
    } catch (err) {
      console.error('Cache flush error:', err.message);
      return false;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
    }
  }
}

module.exports = new CacheService();
