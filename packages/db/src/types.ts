import type {
  admins,
  articles,
  branches,
  categories,
  chatMessages,
  chatSessions,
  chunks
} from "./schema";

export type AdminRow = typeof admins.$inferSelect;
export type InsertAdminRow = typeof admins.$inferInsert;

export type BranchRow = typeof branches.$inferSelect;
export type InsertBranchRow = typeof branches.$inferInsert;

export type ChatSessionRow = typeof chatSessions.$inferSelect;
export type InsertChatSessionRow = typeof chatSessions.$inferInsert;

export type ChatMessageRow = typeof chatMessages.$inferSelect;
export type InsertChatMessageRow = typeof chatMessages.$inferInsert;

export type CategoryRow = typeof categories.$inferSelect;
export type InsertCategoryRow = typeof categories.$inferInsert;

export type ArticleRow = typeof articles.$inferSelect;
export type InsertArticleRow = typeof articles.$inferInsert;

export type ChunkRow = typeof chunks.$inferSelect;
export type InsertChunkRow = typeof chunks.$inferInsert;
