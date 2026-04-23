import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { createDocumentSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const { id: clientId } = await context.params;
  try {
    const parent = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }
    const data = await prisma.clientDocument.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: Ctx) {
  const { id: clientId } = await context.params;
  try {
    const parent = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }
    const json: unknown = await request.json();
    const parsed = createDocumentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const created = await prisma.clientDocument.create({
      data: {
        clientId,
        kind: d.kind,
        title: d.title,
        fileKey: d.fileKey ?? undefined,
      },
    });
    await logActivity({
      action: "document.created",
      clientId,
      detail: created.id,
      metadata: { kind: d.kind, title: d.title },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
