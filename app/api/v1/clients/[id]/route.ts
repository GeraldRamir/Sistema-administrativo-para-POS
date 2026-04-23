import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { prismaToJson } from "@/lib/serialize";
import { updateClientSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  try {
    const row = await prisma.client.findUnique({
      where: { id },
      include: {
        documents: { orderBy: { createdAt: "desc" } },
        revenue: { orderBy: { occurredOn: "desc" }, take: 50 },
        emailLogs: { orderBy: { createdAt: "desc" }, take: 20 },
        activities: { orderBy: { createdAt: "desc" }, take: 30 },
      },
    });
    if (!row) {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(prismaToJson(row));
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  try {
    const json: unknown = await request.json();
    const parsed = updateClientSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    if (Object.keys(d).length === 0) {
      return NextResponse.json({ message: "Sin campos" }, { status: 400 });
    }
    const updated = await prisma.client.update({
      where: { id },
      data: {
        ...d,
        contactName: d.contactName === null ? null : d.contactName,
        phone: d.phone === null ? null : d.phone,
        posOrganizationId: d.posOrganizationId === null ? null : d.posOrganizationId,
        posClientBaseUrl: d.posClientBaseUrl === null ? null : d.posClientBaseUrl,
        notes: d.notes === null ? null : d.notes,
      },
    });
    await logActivity({
      action: "client.updated",
      clientId: id,
      metadata: d,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  try {
    await prisma.client.delete({ where: { id } });
    await logActivity({ action: "client.deleted", clientId: id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return NextResponse.json({ message: "No encontrado" }, { status: 404 });
    }
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
