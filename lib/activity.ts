import "server-only";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function logActivity(
  input: {
    action: string;
    detail?: string;
    clientId?: string;
    metadata?: Prisma.JsonValue;
  },
) {
  return prisma.activityLog.create({
    data: {
      action: input.action,
      detail: input.detail,
      clientId: input.clientId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}
