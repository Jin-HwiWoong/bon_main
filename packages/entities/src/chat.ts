import type { ChatMessageRole, ChatSessionStatus, EntityTimestamp } from "./base";

export interface ChatReferenceEntity {
  articleId: number;
  categoryCode: string;
  title?: string;
}

export interface ChatSessionEntity {
  id: number;
  branchId: number;
  title: string | null;
  status: ChatSessionStatus;
  lastMessageAt: EntityTimestamp | null;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
}

export interface ChatMessageEntity {
  id: number;
  sessionId: number;
  role: ChatMessageRole;
  content: string;
  references: ChatReferenceEntity[] | null;
  fallbackToSm: boolean | null;
  createdAt: EntityTimestamp;
}
