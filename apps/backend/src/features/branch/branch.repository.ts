import { Inject, Injectable } from "@nestjs/common";
import { branches } from "@bon/db";
import { and, desc, eq, or } from "drizzle-orm";
import { DRIZZLE_DB } from "../../infrastructure/database/drizzle.constants";
import type { DrizzleDb } from "../../infrastructure/database/drizzle.types";

@Injectable()
export class BranchRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  list() {
    return this.db.select().from(branches).orderBy(desc(branches.id));
  }

  async create(input: {
    code: string;
    name: string;
    passwordHash: string;
  }) {
    const [row] = await this.db
      .insert(branches)
      .values({
        code: input.code,
        name: input.name,
        passwordHash: input.passwordHash
      })
      .returning();

    return row;
  }

  async update(id: number, patch: Partial<typeof branches.$inferInsert>) {
    const [row] = await this.db.update(branches).set(patch).where(eq(branches.id, id)).returning();
    return row ?? null;
  }

  async findActiveByCodeOrName(codeOrName: string) {
    const [row] = await this.db
      .select()
      .from(branches)
      .where(and(or(eq(branches.code, codeOrName), eq(branches.name, codeOrName)), eq(branches.isActive, true)))
      .limit(1);

    return row ?? null;
  }

  async touchLogin(id: number) {
    await this.db
      .update(branches)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(branches.id, id));
  }

  async delete(id: number) {
    const [row] = await this.db.delete(branches).where(eq(branches.id, id)).returning();
    return row ?? null;
  }
}
