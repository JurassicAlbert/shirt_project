import { Prisma } from "@prisma/client";
import { prisma } from "../db";

export class BackgroundJobRepository {
  async create(input: {
    type: "ai_generation" | "mockup_generation";
    payload: object;
    maxAttempts?: number;
  }) {
    return prisma.backgroundJob.create({
      data: {
        type: input.type,
        status: "waiting",
        payload: input.payload,
        maxAttempts: input.maxAttempts ?? 5,
      },
    });
  }

  async markActive(id: string, attemptCount: number) {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status: "active", attemptCount },
    });
  }

  async markCompleted(id: string, result: object) {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status: "completed", result, errorReason: null },
    });
  }

  async markFailedRetrying(id: string, errorReason: string, attemptCount: number) {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status: "failed", errorReason, attemptCount },
    });
  }

  async markDeadLetter(id: string, errorReason: string, attemptCount: number) {
    return prisma.backgroundJob.update({
      where: { id },
      data: { status: "dead_letter", errorReason, attemptCount },
    });
  }

  async getById(id: string) {
    return prisma.backgroundJob.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async listByStatus(status: "dead_letter" | "waiting" | "failed", limit = 50) {
    return prisma.backgroundJob.findMany({
      where: { status, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  /** Admin queue overview: all non-deleted jobs, newest first. */
  async listRecent(limit = 100) {
    return prisma.backgroundJob.findMany({
      where: { deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  async resetForRetry(id: string) {
    return prisma.backgroundJob.update({
      where: { id },
      data: {
        status: "waiting",
        errorReason: null,
        result: Prisma.DbNull,
        attemptCount: 0,
      },
    });
  }
}
