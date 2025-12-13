/* Simple proxy smoke test: assumes Next dev server is running on localhost:3000 */

const base = process.env.SMOKE_BASE || "http://localhost:3000";
const paths = [
  "/api/proxy/health",
  "/api/proxy/health/full",
  "/api/proxy/analytics/dashboard"
];
const timeoutMs = parseInt(process.env.SMOKE_TIMEOUT_MS || "8000", 10);

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    const body = await res.text();
    return { status: res.status, ok: res.ok, body };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  let failed = false;
  for (const path of paths) {
    const url = `${base}${path}`;
    try {
      const res = await fetchWithTimeout(url);
      console.log(`[proxy-smoke] ${url} -> ${res.status}`);
      if (!res.ok) {
        console.error(res.body);
        failed = true;
      }
    } catch (err) {
      console.error(`[proxy-smoke] ${url} failed:`, err.message);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }
}

main();
