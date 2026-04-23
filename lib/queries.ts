import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ClientStatus } from "@prisma/client";

export async function getDashboardStats() {
  const [totalClients, byStatus, revenue30d, email30d, recentActivity] = await Promise.all([
    prisma.client.count(),
    prisma.client.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.revenueEntry.count({
      where: { occurredOn: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.outboundEmailLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { client: { select: { companyName: true } } },
    }),
  ]);

  const statusMap = Object.fromEntries(
    byStatus.map((r) => [r.status, r._count._all]),
  ) as Record<ClientStatus, number>;

  return { totalClients, statusMap, revenue30d, email30d, recentActivity };
}

export async function getClientsList(params: { q?: string; status?: ClientStatus }) {
  const { q, status } = params;
  const where: Prisma.ClientWhereInput = {};
  if (status) where.status = status;
  if (q?.trim()) {
    const t = q.trim();
    where.OR = [
      { companyName: { contains: t, mode: "insensitive" } },
      { contactEmail: { contains: t, mode: "insensitive" } },
      { contactName: { contains: t, mode: "insensitive" } },
    ];
  }
  return prisma.client.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      revenue: { orderBy: { occurredOn: "desc" }, take: 100 },
      emailLogs: { orderBy: { createdAt: "desc" }, take: 30 },
      activities: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function getAllDocuments() {
  return prisma.clientDocument.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    include: { client: { select: { id: true, companyName: true, contactEmail: true } } },
  });
}

export async function getRevenueList(clientId?: string) {
  return prisma.revenueEntry.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { occurredOn: "desc" },
    take: 200,
    include: { client: { select: { id: true, companyName: true } } },
  });
}

export async function getEmailLogs(clientId?: string) {
  return prisma.outboundEmailLog.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { client: { select: { id: true, companyName: true } } },
  });
}

export async function getActivityList(clientId?: string) {
  return prisma.activityLog.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: { client: { select: { id: true, companyName: true } } },
  });
}

export async function getClientOptions() {
  return prisma.client.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true, contactEmail: true, status: true },
  });
}
