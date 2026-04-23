import "server-only";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/v1/health",
]);

/**
 * Si OPS_API_KEY está definida, las rutas /api/* exigen Authorization: Bearer <key> o X-API-Key.
 * Si no está definida (solo desarrollo), se permiten peticiones sin clave.
 */
export function assertApiAuthorized(request: NextRequest): NextResponse | null {
  const path = request.nextUrl.pathname;
  if (PUBLIC_PATHS.has(path)) {
    return null;
  }
  const required = process.env.OPS_API_KEY?.trim();
  if (!required) {
    return null;
  }
  const auth = request.headers.get("authorization");
  const headerKey = request.headers.get("x-api-key");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (bearer === required || headerKey === required) {
    return null;
  }
  return NextResponse.json(
    { message: "No autorizado. Incluya Authorization: Bearer <OPS_API_KEY> o el header X-API-Key." },
    { status: 401 },
  );
}

export function isApiKeyConfigured(): boolean {
  return Boolean(process.env.OPS_API_KEY?.trim());
}
