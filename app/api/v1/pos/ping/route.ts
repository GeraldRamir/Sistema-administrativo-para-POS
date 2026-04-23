import { NextResponse } from "next/server";
import { posApiConfigured, posApiFetch } from "@/lib/pos-api";

/** Comprueba conectividad con el API del producto POS (ruta /health). */
export async function GET() {
  if (!posApiConfigured()) {
    return NextResponse.json(
      { ok: false, message: "POS_API_BASE_URL no está configurada" },
      { status: 200 },
    );
  }
  try {
    const res = await posApiFetch("/health", { method: "GET" });
    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      pos: body,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error al contactar el POS";
    return NextResponse.json({ ok: false, message }, { status: 502 });
  }
}
