import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { prismaToJson } from "@/lib/serialize";
import { createRevenueSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const { id: clientId } = await context.params;
  try {
    const parent = await prisma.client.findUnique({ where: { id: clientId }, select: { id: true } });
    if (!parent) {
      return NextResponse.json({ message: "Cliente no encontrado" }, { status: 404 });
    }
    const { searchParams } = request.nextUrl;
    const take = Math.min(Number(searchParams.get("limit") ?? "100") || 100, 500);
    const data = await prisma.revenueEntry.findMany({
      where: { clientId },
      orderBy: { occurredOn: "desc" },
      take,
    });
    return NextResponse.json({ data: prismaToJson(data) });
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
    const parsed = createRevenueSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Validación", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const d = parsed.data;
    const created = await prisma.revenueEntry.create({
      data: {
        clientId,
        amount: new Prisma.Decimal(String(d.amount)),
        currency: d.currency ?? "DOP",
        label: d.label ?? undefined,
        occurredOn: d.occurredOn ?? new Date(),
      },
    });
    await logActivity({
      action: "revenue.entry_created",
      clientId,
      metadata: { amount: d.amount, currency: d.currency },
    });
    return NextResponse.json(prismaToJson(created), { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error del servidor";
    return NextResponse.json({ message }, { status: 500 });
  }
}
