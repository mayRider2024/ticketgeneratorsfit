// Lightweight singleton Prisma client with safe fallback if no DATABASE_URL.
let prisma = null;
if (process.env.DATABASE_URL) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require('@prisma/client');
    if (!globalThis.__prisma) {
      globalThis.__prisma = new PrismaClient();
    }
    prisma = globalThis.__prisma;
  } catch (e) {
    console.warn('Prisma client unavailable (did you run prisma generate?) Falling back to file storage.', e.message);
  }
}
export { prisma };
