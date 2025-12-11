const { execSync } = require("child_process");
const path = require("path");

const cwd = path.resolve(__dirname, "..");

const run = (label, cmd, opts = {}) => {
  console.log(`→ ${label}`);
  execSync(cmd, { stdio: "inherit", cwd, env: process.env, ...opts });
};

const sleepMs = (ms) => {
  // Use Atomics.wait to avoid relying on external sleep binaries.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const runMigrationsWithRetry = () => {
  const attempts = 5;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      run("Applying Prisma migrations", "npx prisma migrate deploy");
      return;
    } catch (err) {
      if (attempt === attempts) throw err;
      console.warn(`Prisma migrate failed (attempt ${attempt}/${attempts}). Retrying in 3s...`);
      sleepMs(3000);
    }
  }
};

try {
  run("Validating environment", "node scripts/env.validation.js");
  run("Generating Prisma client", "npx prisma generate");
  runMigrationsWithRetry();
  console.log("Startup checks complete.");
} catch (err) {
  console.error("Startup checks failed.");
  process.exit(1);
}
