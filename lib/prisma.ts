import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma 7: Connection URL is now passed via environment variable
// The adapter or connection string is configured in prisma.config.ts for migrations
// For the client, we can still pass the URL directly or use an adapter
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    // In Prisma 7, DATABASE_URL from environment is used automatically
    // If you need to override, you can use adapter or datasources
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

