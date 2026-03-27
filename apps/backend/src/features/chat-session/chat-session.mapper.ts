import type { ChatSessionListItem, ChatSessionMessageItem } from "@bon/contracts";
import { chatMessages, chatSessions } from "@bon/db";

export function toChatSessionListItem(row: typeof chatSessions.$inferSelect): ChatSessionListItem {
  return {
    id: row.id,
    title: row.title,
    last_message_at: row.lastMessageAt ? row.lastMessageAt.toISOString() : null,
    created_at: row.createdAt.toISOString()
  };
}

export function toChatSessionMessageItem(row: typeof chatMessages.$inferSelect): ChatSessionMessageItem {
  return {
    id: row.id,
    session_id: row.sessionId,
    role: row.role as ChatSessionMessageItem["role"],
    content: row.content,
    references:
      row.references?.map((reference) => ({
        article_id: reference.articleId,
        category_code: reference.categoryCode,
        title: reference.title
      })) ?? null,
    fallback_to_sm: row.fallbackToSm,
    created_at: row.createdAt.toISOString()
  };
}
