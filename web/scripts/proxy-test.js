/* Basic integration test for Next proxy endpoints.
   Run: SMOKE_BASE=http://localhost:3000 node scripts/proxy-test.js */

const base = process.env.SMOKE_BASE || "http://localhost:3000";

async function check(path, expectOk = true) {
  const res = await fetch(base + path);
  const body = await res.text();
  if (expectOk && !res.ok) {
    throw new Error(`${path} failed: ${res.status} ${body}`);
  }
  console.log(`[proxy-test] ${path} -> ${res.status}`);
  return body;
}

async function main() {
  await check("/api/proxy/health");
  await check("/api/proxy/health/full");
  await check("/api/proxy/analytics/dashboard", false); // may require auth; ensure it responds
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
