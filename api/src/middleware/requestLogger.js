/**
 * Request Logger Middleware
 * Enhanced logging with request IDs for tracing distributed systems
 */

const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const requestLogger = (req, res, next) => {
  // Generate unique request ID
  req.id = generateRequestId();
  req.startTime = Date.now();

  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.id);

  // Log request
  console.log(`[${req.id}] ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Intercept response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - req.startTime;
    const status = res.statusCode;
    const statusColor = status < 400 ? '\x1b[32m' : status < 500 ? '\x1b[33m' : '\x1b[31m';

    console.log(
      `[${req.id}] ${statusColor}${status}\x1b[0m ${req.method} ${req.path} ${duration}ms`
    );

    // Call original send
    return originalSend.call(this, data);
  };

  next();
};

/**
 * Add request ID to all outgoing requests
 */
const contextMiddleware = (req, res, next) => {
  // Make request ID available throughout the request
  res.locals = res.locals || {};
  res.locals.requestId = req.id;

  next();
};

module.exports = {
  requestLogger,
  contextMiddleware,
  generateRequestId,
};
