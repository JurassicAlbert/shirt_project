import type { Prisma } from "@prisma/client";
import { prisma } from "../db";

export class AuditWriteRepository {
  async log(input: {
    actorId?: string;
    actorRole?: string;
    eventType: string;
    entityType: string;
    entityId: string;
    payload?: Prisma.InputJsonValue;
  }) {
    return prisma.auditLog.create({
      data: {
        ...(input.actorId != null ? { actorId: input.actorId } : {}),
        ...(input.actorRole != null ? { actorRole: input.actorRole } : {}),
        eventType: input.eventType,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.payload != null ? { payload: input.payload } : {}),
      },
    });
  }

  async listForEntity(entityType: string, entityId: string, take = 30) {
    return prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: "desc" },
      take,
    });
  }
}
