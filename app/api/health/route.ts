import { NextResponse } from "next/server";
import { isMailConfigured } from "@/lib/mail";
import { isApiKeyConfigured } from "@/lib/api-auth";
import { posApiConfigured } from "@/lib/pos-api";

/**
 * Público: estado del servicio (sin tocar la base de datos).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pos-ops",
    mail: { configured: isMailConfigured() },
    posApi: { configured: posApiConfigured() },
    apiKeyRequired: isApiKeyConfigured(),
    timestamp: new Date().toISOString(),
  });
}
