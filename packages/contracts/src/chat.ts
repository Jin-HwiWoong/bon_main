export type UiMessageRole = "user" | "assistant";

export interface ChatReference {
  article_id: number;
  category_code: string;
  title?: string;
}

export interface UiMessage {
  id?: string;
  role: UiMessageRole;
  content: string;
  references?: ChatReference[];
}

export interface ChatSessionListItem {
  id: number;
  title: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatSessionMessageItem {
  id: number;
  session_id: number;
  role: UiMessageRole;
  content: string;
  references?: ChatReference[] | null;
  fallback_to_sm?: boolean | null;
  created_at: string;
}

export interface CreateChatSessionRequest {
  title?: string;
}

export interface CreateChatMessageRequest {
  content: string;
  role: UiMessageRole;
  references?: ChatReference[] | null;
  fallback_to_sm?: boolean | null;
}

export interface ChatRequest {
  question: string;
  session_id?: number;
}

export interface ChatResponse {
  answer: string;
  session_id: number;
  fallback_to_sm: boolean;
  references: ChatReference[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  cost?: {
    prompt_cost?: number;
    completion_cost?: number;
    total_cost?: number;
  };
}
