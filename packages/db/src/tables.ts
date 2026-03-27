export const DB_TABLES = {
  admins: "admins",
  branches: "branches",
  chatSessions: "chat_sessions",
  chatMessages: "chat_messages",
  categories: "kb_category",
  articles: "kb_article",
  chunks: "kb_chunk"
} as const;

export type DbTableName = (typeof DB_TABLES)[keyof typeof DB_TABLES];
