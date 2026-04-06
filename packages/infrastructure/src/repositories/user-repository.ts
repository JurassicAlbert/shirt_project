import type { User, UserRole } from "@prisma/client";
import { prisma } from "../db";

export class UserRepository {
  async create(data: {
    email: string;
    passwordHash: string;
    role?: UserRole;
    termsAcceptedAt: Date;
  }): Promise<User> {
    return prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }
}
