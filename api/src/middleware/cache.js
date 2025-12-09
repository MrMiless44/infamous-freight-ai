/**
 * Cache Middleware
 * Implements response caching for expensive operations
 */

const cacheService = require('../services/cache');

const cacheMiddleware = (options = {}) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const ttl = options.ttl || 3600; // Default 1 hour
    const cacheKey = `${req.method}:${req.originalUrl || req.url}`;

    try {
      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        res.set('X-Cache-Hit', 'true');
        return res.json(cached);
      }
    } catch (err) {
      console.warn('Cache read error:', err.message);
      // Continue without cache on error
    }

    // Intercept response
    const originalJson = res.json.bind(res);
    res.json = function (data) {
      res.set('X-Cache-Hit', 'false');

      // Store in cache
      if (res.statusCode === 200) {
        cacheService.set(cacheKey, data, ttl).catch((err) => {
          console.warn('Cache write error:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

/**
 * Cache invalidation helper
 */
const invalidateCache = async (pattern) => {
  try {
    await cacheService.invalidate(pattern);
  } catch (err) {
    console.warn('Cache invalidation error:', err.message);
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
