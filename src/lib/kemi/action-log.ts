import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function logAction(
  actionType: string,
  description: string,
  details: Record<string, unknown> = {},
  triggeredBy: string = "user_request",
  channel?: string,
) {
  try {
    await prisma.actionLog.create({
      data: {
        actionType,
        description,
        details: details as Prisma.InputJsonValue,
        triggeredBy,
        channel,
      },
    });
  } catch {
    console.error("Failed to log action:", actionType);
  }
}

export async function getActionLog(hoursAgo: number = 24, limit: number = 20) {
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return prisma.actionLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
