import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CategorySummary, CreateCategoryRequest, UpdateCategoryRequest } from "@bon/contracts";
import { categories } from "@bon/db";
import { toCategorySummary } from "./category.mapper";
import { CategoryRepository } from "./category.repository";

@Injectable()
export class CategoryService {
  constructor(@Inject(CategoryRepository) private readonly categoryRepository: CategoryRepository) {}

  async listWithCounts(): Promise<CategorySummary[]> {
    const rows = await this.categoryRepository.listWithCounts();
    return rows.map(toCategorySummary);
  }

  async create(input: CreateCategoryRequest): Promise<CategorySummary> {
    const row = await this.categoryRepository.create(input);

    return toCategorySummary({
      ...row,
      articleCount: 0
    });
  }

  async update(id: number, input: UpdateCategoryRequest): Promise<CategorySummary> {
    const patch: Partial<typeof categories.$inferInsert> = {
      updatedAt: new Date()
    };
    if (typeof input.name === "string") patch.name = input.name;
    if ("description" in input) patch.description = input.description ?? null;
    if (typeof input.sort_order === "number") patch.sortOrder = input.sort_order;
    if (typeof input.is_active === "boolean") patch.isActive = input.is_active;

    const row = await this.categoryRepository.update(id, patch);
    if (!row) throw new NotFoundException("데이터를 찾을 수 없습니다.");

    const total = await this.categoryRepository.countPublishedArticles(id);

    return toCategorySummary({
      ...row,
      articleCount: total
    });
  }

  async softDelete(id: number): Promise<void> {
    const deleted = await this.categoryRepository.softDeleteWithArticles(id);
    if (!deleted) {
      throw new NotFoundException("데이터를 찾을 수 없습니다.");
    }
  }
}
