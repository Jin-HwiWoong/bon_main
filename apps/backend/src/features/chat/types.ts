export type RagDocument = {
  article_id: number;
  category_code: string;
  title?: string;
  requires_sm: boolean;
  content: string;
  retrieval_kind?: "raw" | "summary" | string;
  score?: number;
  retrieval_score?: number;
  title_score?: number;
};
