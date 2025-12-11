const { PrismaClient } = require('@prisma/client');

const shouldMockPrisma =
  process.env.MOCK_PRISMA === 'true' ||
  (process.env.NODE_ENV === 'test' && process.env.USE_REAL_DATABASE !== 'true');

/**
 * Lightweight mock to keep tests from trying to open network sockets to the Prisma
 * query engine (network is blocked in the harness). All methods resolve with
 * harmless defaults so routes can load without a database.
 */
function createMockModel(defaults = {}) {
  return {
    findMany: async () => [],
    findUnique: async () => null,
    findFirst: async () => null,
    create: async ({ data } = {}) => ({ id: 'mock-id', ...defaults, ...(data || {}) }),
    update: async ({ data } = {}) => ({ ...defaults, ...(data || {}) }),
    updateMany: async () => ({ count: 0 }),
    delete: async () => defaults,
    deleteMany: async () => ({ count: 0 }),
    upsert: async ({ create, update } = {}) => ({
      id: 'mock-id',
      ...defaults,
      ...(create || {}),
      ...(update || {}),
    }),
    count: async () => 0,
    aggregate: async () => ({ _sum: { amount: 0 } }),
  };
}

function createMockPrisma() {
  const model = createMockModel;
  return {
    user: model(),
    driver: model(),
    shipment: model(),
    aiEvent: model(),
    userOnboarding: model(),
    referralCode: model(),
    referralConversion: model(),
    referralReward: model(),
    payment: model({ amount: 0, status: 'mock' }),
    subscription: model(),
    invoice: model(),
    $queryRaw: async () => [{ ok: true }],
    $disconnect: async () => {},
  };
}

// Singleton Prisma client to avoid exhausting database connections
const prisma = shouldMockPrisma
  ? createMockPrisma()
  : new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

module.exports = prisma;
