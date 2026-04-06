import { prisma } from "../db";

export class DesignRepository {
  async create(input: {
    userId: string;
    prompt: string;
    normalizedPrompt: string;
    promptHash: string;
    imageUrl?: string;
    status?: "pending" | "completed" | "failed" | "moderated";
    errorMessage?: string;
  }) {
    return prisma.design.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        normalizedPrompt: input.normalizedPrompt,
        promptHash: input.promptHash,
        imageUrl: input.imageUrl ?? null,
        errorMessage: input.errorMessage ?? null,
        sourceType: "ai",
        status: input.status ?? "pending",
      },
    });
  }

  async completeGeneration(input: { designId: string; imageUrl: string }) {
    return prisma.design.update({
      where: { id: input.designId },
      data: {
        imageUrl: input.imageUrl,
        status: "completed",
        errorMessage: null,
      },
    });
  }

  async failGeneration(input: { designId: string; errorMessage: string }) {
    return prisma.design.update({
      where: { id: input.designId },
      data: {
        status: "failed",
        errorMessage: input.errorMessage,
      },
    });
  }

  async resetToPending(input: { designId: string }) {
    return prisma.design.update({
      where: { id: input.designId },
      data: {
        status: "pending",
        errorMessage: null,
        imageUrl: null,
      },
    });
  }

  async updateTextOverlayForOwner(input: { designId: string; userId: string; textOverlay: string | undefined }) {
    const design = await prisma.design.findFirst({
      where: { id: input.designId, userId: input.userId },
    });
    if (!design) return null;

    await prisma.productConfiguration.updateMany({
      where: { designId: input.designId },
      data: { textOverlay: input.textOverlay ?? null },
    });

    return design;
  }

  async findOwned(input: { designId: string; userId: string }) {
    return prisma.design.findFirst({
      where: { id: input.designId, userId: input.userId },
    });
  }
}
