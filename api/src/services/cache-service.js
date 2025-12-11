/**
 * Redis Cache Service
 * Enables caching for frequently accessed data
 * Reduces database load and improves response times
 */

const Redis = require("ioredis");

let redis = null;

const cacheConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  enableOfflineQueue: false,
};

/**
 * Initialize Redis connection
 */
function initialize() {
  if (!process.env.REDIS_URL && !process.env.REDIS_HOST) {
    console.log("⚠️  Redis not configured. Caching disabled.");
    return;
  }

  try {
    const redisUrl = process.env.REDIS_URL;
    redis = redisUrl ? new Redis(redisUrl) : new Redis(cacheConfig);

    redis.on("connect", () => {
      console.log("✅ Redis connected");
    });

    redis.on("error", (err) => {
      console.error("Redis error:", err);
    });
  } catch (error) {
    console.error("Failed to initialize Redis:", error);
  }
}

/**
 * Get value from cache
 */
async function get(key) {
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Redis GET error:", error);
    return null;
  }
}

/**
 * Set value in cache with optional TTL (seconds)
 */
async function set(key, value, ttl = 3600) {
  if (!redis) return false;

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    console.error("Redis SET error:", error);
    return false;
  }
}

/**
 * Delete key from cache
 */
async function del(key) {
  if (!redis) return false;

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error("Redis DEL error:", error);
    return false;
  }
}

/**
 * Clear all cache
 */
async function clear() {
  if (!redis) return false;

  try {
    await redis.flushdb();
    return true;
  } catch (error) {
    console.error("Redis FLUSHDB error:", error);
    return false;
  }
}

/**
 * Check if Redis is connected and healthy
 */
function isHealthy() {
  if (!redis) return false;
  return redis.status === "ready";
}

/**
 * Cache key builders
 */
const keys = {
  user: (userId) => `user:${userId}`,
  subscription: (subId) => `subscription:${subId}`,
  invoice: (invoiceId) => `invoice:${invoiceId}`,
  payment: (paymentId) => `payment:${paymentId}`,
  stripeCustomer: (customerId) => `stripe:customer:${customerId}`,
  stripeSubscription: (subId) => `stripe:subscription:${subId}`,
  recentPayments: (userId) => `payments:${userId}:recent`,
  recentInvoices: (userId) => `invoices:${userId}:recent`,
};

module.exports = {
  initialize,
  get,
  set,
  del,
  clear,
  isHealthy,
  keys,
};
