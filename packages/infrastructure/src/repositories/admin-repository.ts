import { prisma } from "../db";

export class AdminRepository {
  async listRecentOrders(limit = 50) {
    return prisma.order.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { items: true, user: { select: { id: true, email: true } } },
    });
  }

  async listRecentReturns(limit = 50) {
    return prisma.returnRequest.findMany({
      where: { deletedAt: null },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async listDesignsPendingModeration(limit = 50) {
    return prisma.design.findMany({
      where: { status: "completed", imageUrl: { not: null } },
      take: limit,
      orderBy: { updatedAt: "desc" },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async moderateDesign(opts: {
    designId: string;
    moderatorUserId: string;
    decision: "approve" | "reject";
    reason?: string;
  }) {
    const design = await prisma.design.findUnique({ where: { id: opts.designId } });
    if (!design || design.status !== "completed" || !design.imageUrl) {
      return { ok: false as const, code: "NOT_FOUND" as const };
    }

    await prisma.moderationAction.create({
      data: {
        designId: opts.designId,
        moderator: opts.moderatorUserId,
        action: opts.decision,
        reason: opts.reason ?? null,
      },
    });

    if (opts.decision === "approve") {
      await prisma.design.update({
        where: { id: opts.designId },
        data: { status: "moderated", moderatedByUserId: opts.moderatorUserId },
      });
    } else {
      await prisma.design.update({
        where: { id: opts.designId },
        data: {
          status: "failed",
          errorMessage: opts.reason ?? "Rejected by moderator",
          moderatedByUserId: opts.moderatorUserId,
        },
      });
    }

    return { ok: true as const };
  }

  async kpiSnapshot() {
    const [ordersCount, returnsCount, designsCount, usersCount] = await Promise.all([
      prisma.order.count(),
      prisma.returnRequest.count(),
      prisma.design.count(),
      prisma.user.count(),
    ]);

    return {
      ordersTotal: ordersCount,
      returnsTotal: returnsCount,
      designsTotal: designsCount,
      usersTotal: usersCount,
    };
  }
}
