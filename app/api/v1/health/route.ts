import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isMailConfigured } from "@/lib/mail";
import { isApiKeyConfigured } from "@/lib/api-auth";
import { posApiConfigured } from "@/lib/pos-api";

/**
 * Público (sin OPS_API_KEY). Incluye ping a la base y flags de configuración.
 */
export async function GET() {
  let database: "ok" | "error" = "ok";
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = "error";
  }
  return NextResponse.json({
    ok: database === "ok",
    service: "pos-ops",
    database,
    mail: { configured: isMailConfigured() },
    posApi: { configured: posApiConfigured() },
    apiKeyRequired: isApiKeyConfigured(),
    timestamp: new Date().toISOString(),
  });
}
