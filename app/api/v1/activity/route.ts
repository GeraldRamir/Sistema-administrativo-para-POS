import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createActivitySchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const clientId = searchParams.get("clientId")?.trim();
    const take = Math.min(Number(searchParams.get("limit") ?? "100") || 100, 500);
    const skip = Math.max(Number(searchParams.get("offset") ?? "0") || 0, 0);

    const where: Prisma.ActivityLogWhereInput = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const [data, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.activityLog.count({ where }),
    ]);
    return NextResponse.json({ data, total, take, skip });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json: unknown = await request.json();
    const parsed = createActivitySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const created = await prisma.activityLog.create({
      data: {
        action: d.action,
        detail: d.detail ?? undefined,
        clientId: d.clientId ?? undefined,
        metadata: d.metadata === undefined || d.metadata === null ? undefined : d.metadata,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
