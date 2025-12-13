const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function authHybrid(req, res, next) {
  const authHeader = req.headers.authorization;
  const apiKey = req.headers["x-api-key"];

  if (apiKey && apiKey === process.env.AI_SYNTHETIC_API_KEY) {
    const syntheticIdentity = {
      mode: "api-key",
      scopes: ["ai:query", "data:read", "system:admin", "ai:repair"],
      subject: "ai-synthetic-engine",
      role: "admin",
    };
    req.auth = syntheticIdentity;
    req.user = {
      id: syntheticIdentity.subject,
      role: syntheticIdentity.role,
      scopes: syntheticIdentity.scopes,
    };
    return next();
  }

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const subject = decoded.sub || decoded.id || decoded.userId;
      const scopes =
        decoded.scopes ||
        (typeof decoded.scope === "string" ? decoded.scope.split(" ") : []);
      const role = decoded.role || decoded.roles?.[0] || "user";

      if (!subject) {
        return res.status(401).json({ error: "Invalid token payload" });
      }

      req.auth = {
        mode: "jwt",
        subject,
        scopes: scopes.length ? scopes : ["user:basic"],
        role,
      };
      req.user = {
        id: subject,
        role,
        scopes: req.auth.scopes,
      };
      return next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  }

  return res.status(401).json({ error: "Unauthorized" });
}

module.exports = authHybrid;
