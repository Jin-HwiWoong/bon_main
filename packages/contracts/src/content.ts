export interface CategorySummary {
  id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  article_count: string;
}

export interface ArticleSummary {
  id: number;
  category_id: number;
  title: string;
  content: string;
  summary?: string | null;
  priority: number;
  requires_sm: boolean;
  is_published: boolean;
}

export interface BranchSummary {
  id: number;
  code: string;
  name: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  code: string;
  name: string;
  description?: string | null;
  sort_order?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  password: string;
}

export interface UpdateBranchRequest {
  name?: string;
  password?: string;
  is_active?: boolean;
}

export interface CreateArticleRequest {
  category_id: number;
  title: string;
  content: string;
  summary?: string | null;
  priority?: number;
  requires_sm?: boolean;
  is_published?: boolean;
}

export type UpdateArticleRequest = Partial<CreateArticleRequest>;
