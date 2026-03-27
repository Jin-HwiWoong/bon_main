import { Inject, Injectable } from "@nestjs/common";
import { articles, categories } from "@bon/db";
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { DRIZZLE_DB } from "../../infrastructure/database/drizzle.constants";
import type { DrizzleDb } from "../../infrastructure/database/drizzle.types";

@Injectable()
export class CategoryRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  listWithCounts() {
    return this.db
      .select({
        id: categories.id,
        code: categories.code,
        name: categories.name,
        description: categories.description,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        articleCount: sql<number>`COALESCE(COUNT(${articles.id}), 0)::int`
      })
      .from(categories)
      .leftJoin(
        articles,
        and(eq(articles.categoryId, categories.id), eq(articles.isPublished, true), isNull(articles.deletedAt))
      )
      .where(isNull(categories.deletedAt))
      .groupBy(categories.id)
      .orderBy(asc(categories.sortOrder), desc(categories.id));
  }

  async getById(id: number) {
    const [row] = await this.db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .limit(1);

    return row ?? null;
  }

  async create(input: {
    code: string;
    name: string;
    description?: string | null;
    sort_order?: number;
  }) {
    const [row] = await this.db
      .insert(categories)
      .values({
        code: input.code,
        name: input.name,
        description: input.description ?? null,
        sortOrder: input.sort_order ?? 0
      })
      .returning();

    return row;
  }

  async update(
    id: number,
    patch: Partial<typeof categories.$inferInsert>
  ) {
    const [row] = await this.db
      .update(categories)
      .set(patch)
      .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
      .returning();
    return row ?? null;
  }

  async countPublishedArticles(id: number) {
    const [{ total }] = await this.db
      .select({ total: sql<number>`COUNT(${articles.id})::int` })
      .from(articles)
      .where(and(eq(articles.categoryId, id), eq(articles.isPublished, true), isNull(articles.deletedAt)));

    return total;
  }

  async softDeleteWithArticles(id: number) {
    return this.db.transaction(async (tx) => {
      const [category] = await tx
        .update(categories)
        .set({
          deletedAt: new Date(),
          isActive: false,
          updatedAt: new Date()
        })
        .where(and(eq(categories.id, id), isNull(categories.deletedAt)))
        .returning({ id: categories.id });

      if (!category) {
        return false;
      }

      await tx
        .update(articles)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(eq(articles.categoryId, id), isNull(articles.deletedAt)));

      return true;
    });
  }
}
