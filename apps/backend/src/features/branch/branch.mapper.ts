import type { BranchSummary } from "@bon/contracts";
import { branches } from "@bon/db";

export function toBranchSummary(row: typeof branches.$inferSelect): BranchSummary {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    is_active: row.isActive,
    last_login_at: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString()
  };
}
