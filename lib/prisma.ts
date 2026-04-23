import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (typeof url === "string" && url.trim().length > 0) {
    return url.trim();
  }
  throw new Error(
    "Missing DATABASE_URL. In the pos-ops folder, in .env, set DATABASE_URL to your Neon connection string (Project → connection string) with ssl mode; then restart `npm run dev`.\n" +
      "Run from the pos-ops folder, not a parent monorepo root (see package.json).",
  );
}

const databaseUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: databaseUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
