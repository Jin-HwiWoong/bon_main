import { Inject, Injectable } from "@nestjs/common";
import { articles } from "@bon/db";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { DRIZZLE_DB } from "../../infrastructure/database/drizzle.constants";
import type { DrizzleDb } from "../../infrastructure/database/drizzle.types";

@Injectable()
export class ArticleRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  list(params: {
    category_id?: number;
    is_published?: boolean;
    page?: number;
    page_size?: number;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.max(1, Math.min(params.page_size ?? 20, 100));
    const offset = (page - 1) * pageSize;
    const filters = [isNull(articles.deletedAt)];
    if (params.category_id) filters.push(eq(articles.categoryId, params.category_id));
    if (typeof params.is_published === "boolean") filters.push(eq(articles.isPublished, params.is_published));
    const whereClause = and(...filters);

    return Promise.all([
      this.db
        .select({
          id: articles.id,
          category_id: articles.categoryId,
          title: articles.title,
          content: articles.content,
          summary: articles.summary,
          priority: articles.priority,
          requires_sm: articles.requiresSm,
          is_published: articles.isPublished
        })
        .from(articles)
        .where(whereClause)
        .orderBy(desc(articles.id))
        .limit(pageSize)
        .offset(offset),
      this.db
        .select({ total: sql<number>`COUNT(*)::int` })
        .from(articles)
        .where(whereClause)
    ]).then(([data, countRows]) => ({
      data,
      total: countRows[0]?.total ?? 0
    }));
  }

  async getById(id: number) {
    const [row] = await this.db
      .select({
        id: articles.id,
        category_id: articles.categoryId,
        title: articles.title,
        content: articles.content,
        summary: articles.summary,
        priority: articles.priority,
        requires_sm: articles.requiresSm,
        is_published: articles.isPublished
      })
      .from(articles)
      .where(and(eq(articles.id, id), isNull(articles.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async findById(id: number) {
    const [row] = await this.db.select().from(articles).where(eq(articles.id, id)).limit(1);
    return row ?? null;
  }

  async softDelete(id: number) {
    await this.db
      .update(articles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date()
      })
        .where(and(eq(articles.id, id), isNull(articles.deletedAt)));
  }
}
