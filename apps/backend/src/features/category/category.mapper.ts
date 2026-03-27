import type { CategorySummary } from "@bon/contracts";

type CategorySummaryRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  articleCount?: number | string | null;
};

export function toCategorySummary(row: CategorySummaryRow): CategorySummary {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description,
    sort_order: row.sortOrder,
    is_active: row.isActive,
    article_count: String(row.articleCount ?? 0)
  };
}
