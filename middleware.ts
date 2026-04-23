import { NextRequest, NextResponse } from "next/server";

const PUBLIC = new Set(["/api/health", "/api/v1/health"]);

export function middleware(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  if (PUBLIC.has(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  const key = process.env.OPS_API_KEY?.trim();
  if (!key) {
    return NextResponse.next();
  }
  const auth = request.headers.get("authorization");
  const headerKey = request.headers.get("x-api-key");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  if (bearer === key || headerKey === key) {
    return NextResponse.next();
  }
  return NextResponse.json(
    { message: "No autorizado. Defina OPS_API_KEY en .env y envíe el header adecuado en cada petición a /api/*." },
    { status: 401 },
  );
}

export const config = {
  matcher: "/api/:path*",
};
