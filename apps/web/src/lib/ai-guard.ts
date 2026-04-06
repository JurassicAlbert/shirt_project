import { prisma } from "@shirt/infrastructure";

const DAILY_LIMIT = 5;
const PER_MINUTE_LIMIT = 3;

const dayKey = () => new Date().toISOString().slice(0, 10);

export const assertAiAllowance = async (userId: string) => {
  const key = dayKey();
  const current = await prisma.aiUsageLedger.findUnique({
    where: { userId_dayKey: { userId, dayKey: key } },
  });
  if (current && current.generationsCount >= DAILY_LIMIT) {
    await prisma.aiUsageLedger.update({
      where: { userId_dayKey: { userId, dayKey: key } },
      data: { blockedCount: { increment: 1 } },
    });
    return { ok: false as const, reason: "daily_limit_reached" };
  }

  const minuteAgo = new Date(Date.now() - 60_000);
  const minuteCount = await prisma.auditLog.count({
    where: {
      actorId: userId,
      eventType: "ai_generate",
      createdAt: { gte: minuteAgo },
    },
  });
  if (minuteCount >= PER_MINUTE_LIMIT) {
    await prisma.aiUsageLedger.upsert({
      where: { userId_dayKey: { userId, dayKey: key } },
      create: { userId, dayKey: key, blockedCount: 1 },
      update: { blockedCount: { increment: 1 } },
    });
    return { ok: false as const, reason: "rate_limited" };
  }

  await prisma.aiUsageLedger.upsert({
    where: { userId_dayKey: { userId, dayKey: key } },
    create: { userId, dayKey: key, generationsCount: 1 },
    update: { generationsCount: { increment: 1 } },
  });
  await prisma.auditLog.create({
    data: {
      actorId: userId,
      eventType: "ai_generate",
      entityType: "Design",
      entityId: "pending",
    },
  });
  return { ok: true as const };
};
