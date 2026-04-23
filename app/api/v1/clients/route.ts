import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { createClientSchema } from "@/lib/validators";
import { ClientStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status") as ClientStatus | null;
    const take = Math.min(Number(searchParams.get("limit") ?? "50") || 50, 200);
    const skip = Math.max(Number(searchParams.get("offset") ?? "0") || 0, 0);

    const where: Prisma.ClientWhereInput = {};
    if (status && Object.values(ClientStatus).includes(status)) {
      where.status = status;
    }
    if (q) {
      where.OR = [
        { companyName: { contains: q, mode: "insensitive" } },
        { contactEmail: { contains: q, mode: "insensitive" } },
        { contactName: { contains: q, mode: "insensitive" } },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        take,
        skip,
        include: {
          _count: { select: { documents: true, revenue: true, emailLogs: true } },
        },
      }),
      prisma.client.count({ where }),
    ]);
    return NextResponse.json({ data: rows, total, take, skip });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const json: unknown = await request.json();
    const parsed = createClientSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const created = await prisma.client.create({
      data: {
        companyName: d.companyName,
        contactEmail: d.contactEmail,
        contactName: d.contactName ?? undefined,
        phone: d.phone ?? undefined,
        status: d.status ?? ClientStatus.LEAD,
        posOrganizationId: d.posOrganizationId ?? undefined,
        posClientBaseUrl: d.posClientBaseUrl ?? undefined,
        notes: d.notes ?? undefined,
      },
    });
    await logActivity({
      action: "client.created",
      detail: created.id,
      clientId: created.id,
      metadata: { companyName: created.companyName },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ message: "Email u organización POS duplicada" }, { status: 409 });
    }
    return NextResponse.json({ message }, { status: 500 });
  }
}
