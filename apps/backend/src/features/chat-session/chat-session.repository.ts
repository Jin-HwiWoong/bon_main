import { Inject, Injectable } from "@nestjs/common";
import { chatMessages, chatSessions } from "@bon/db";
import { and, asc, desc, eq } from "drizzle-orm";
import { DRIZZLE_DB } from "../../infrastructure/database/drizzle.constants";
import type { DrizzleDb } from "../../infrastructure/database/drizzle.types";

@Injectable()
export class ChatSessionRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  listByBranch(branchId: number) {
    return this.db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.branchId, branchId))
      .orderBy(desc(chatSessions.lastMessageAt), desc(chatSessions.id));
  }

  async create(branchId: number, title?: string | null) {
    const [row] = await this.db
      .insert(chatSessions)
      .values({
        branchId,
        title: title?.trim() || null
      })
      .returning();

    return row;
  }

  async findOwnedSession(branchId: number, sessionId: number) {
    const [session] = await this.db
      .select()
      .from(chatSessions)
      .where(and(eq(chatSessions.id, sessionId), eq(chatSessions.branchId, branchId)))
      .limit(1);

    return session ?? null;
  }

  listMessages(sessionId: number) {
    return this.db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(asc(chatMessages.id));
  }

  async createMessage(input: {
    sessionId: number;
    role: string;
    content: string;
    references?:
      | Array<{
          articleId: number;
          categoryCode: string;
          title?: string;
        }>
      | null;
    fallbackToSm?: boolean | null;
  }) {
    const [row] = await this.db
      .insert(chatMessages)
      .values({
        sessionId: input.sessionId,
        role: input.role,
        content: input.content,
        references: input.references ?? undefined,
        fallbackToSm: input.fallbackToSm ?? null
      })
      .returning();

    return row;
  }

  async touchSession(sessionId: number, lastMessageAt: Date) {
    await this.db
      .update(chatSessions)
      .set({
        lastMessageAt,
        updatedAt: new Date()
      })
      .where(eq(chatSessions.id, sessionId));
  }
}
