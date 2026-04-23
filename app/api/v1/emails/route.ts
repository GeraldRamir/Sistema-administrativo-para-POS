import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Listado de envíos registrados (OutboundEmailLog). */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const clientId = searchParams.get("clientId")?.trim();
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const skip = Math.max(Number(searchParams.get("offset") ?? "0") || 0, 0);

    const where = clientId ? { clientId } : {};

    const [data, total] = await Promise.all([
      prisma.outboundEmailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.outboundEmailLog.count({ where }),
    ]);
    return NextResponse.json({ data, total, take, skip });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
