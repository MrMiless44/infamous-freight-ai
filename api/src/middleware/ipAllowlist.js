/**
 * IP Allowlist Middleware
 * Blocks requests unless the client IP matches configured allowlist entries.
 * Supports IPv4 exact matches and CIDR ranges. When no allowlist is set, all traffic is allowed.
 */

const ALLOWLIST = (process.env.IP_ALLOWLIST || "")
  .split(",")
  .map(entry => entry.trim())
  .filter(Boolean);

const isIPv4 = ip => /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);

const normalizeIp = ip => {
  // Express may provide IPv6-mapped IPv4: ::ffff:1.2.3.4
  if (ip.startsWith("::ffff:")) {
    return ip.replace("::ffff:", "");
  }
  // Remove IPv6 zone (not supported here)
  return ip;
};

const ipToLong = ip => {
  if (!isIPv4(ip)) return null;
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
};

const cidrMatch = (ip, cidr) => {
  const [range, bitsStr] = cidr.split("/");
  const bits = parseInt(bitsStr, 10);
  if (!range || Number.isNaN(bits)) return false;
  const ipLong = ipToLong(ip);
  const rangeLong = ipToLong(range);
  if (ipLong === null || rangeLong === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipLong & mask) === (rangeLong & mask);
};

const isAllowedIp = (ip, allowlist) => {
  if (!allowlist.length) return true; // Allow all when no allowlist defined
  const normalized = normalizeIp(ip);
  for (const entry of allowlist) {
    if (entry.includes("/")) {
      if (cidrMatch(normalized, entry)) return true;
    } else if (normalized === entry) {
      return true;
    }
  }
  return false;
};

module.exports = function ipAllowlist(req, res, next) {
  if (!ALLOWLIST.length) return next();

  const clientIp = req.ip || req.connection?.remoteAddress || "";
  if (isAllowedIp(clientIp, ALLOWLIST)) {
    return next();
  }

  return res.status(403).json({ error: "Forbidden", message: "IP not allowed" });
};
