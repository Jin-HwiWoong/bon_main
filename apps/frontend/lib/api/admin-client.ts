import type {
  ArticleSummary,
  BranchSummary,
  CategorySummary,
  ChatResponse,
  ChatSessionListItem,
  ChatSessionMessageItem,
  CreateArticleImageUploadUrlRequest,
  CreateArticleImageUploadUrlResponse,
  CreateArticleRequest,
  CreateBranchRequest,
  CreateCategoryRequest,
  UpdateArticleRequest,
  UpdateBranchRequest,
  UpdateCategoryRequest
} from "@bon/contracts";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "@/lib/api/http";

export type PreviewChatResponse = ChatResponse & {
  used_chunks?: Array<{
    content: string;
    score?: number;
  }>;
};

export function getCategories() {
  return apiGet<CategorySummary[]>("/api/admin/categories", undefined, "카테고리를 불러오지 못했습니다.");
}

export function createCategory(body: CreateCategoryRequest) {
  return apiPost<{ id: number }>("/api/admin/categories", body, undefined, "카테고리 생성에 실패했습니다.");
}

export function updateCategory(id: string | number, body: UpdateCategoryRequest) {
  return apiPut<{ id: number }>(`/api/admin/categories/${id}`, body, undefined, "카테고리 수정에 실패했습니다.");
}

export function deleteCategory(id: string | number) {
  return apiDelete<{ success: true }>(`/api/admin/categories/${id}`, undefined, "카테고리 삭제에 실패했습니다.");
}

export function getArticles(categoryId?: string) {
  const query = categoryId ? `?category_id=${categoryId}` : "";
  return apiGet<{ items: ArticleSummary[]; total: number }>(
    `/api/admin/articles${query}`,
    undefined,
    "문서 목록을 불러오지 못했습니다."
  );
}

export function getArticle(id: string | number) {
  return apiGet<ArticleSummary>(`/api/admin/articles/${id}`, undefined, "문서를 불러오지 못했습니다.");
}

export function createArticle(body: CreateArticleRequest) {
  return apiPost<{ id: number }>("/api/admin/articles", body, undefined, "문서 생성에 실패했습니다.");
}

export function createArticleImageUploadUrl(body: CreateArticleImageUploadUrlRequest) {
  return apiPost<CreateArticleImageUploadUrlResponse>(
    "/api/admin/articles/presigned-upload",
    body,
    undefined,
    "이미지 업로드 URL 생성에 실패했습니다."
  );
}

export function updateArticle(id: string | number, body: UpdateArticleRequest) {
  return apiPut<{ id: number }>(`/api/admin/articles/${id}`, body, undefined, "문서 수정에 실패했습니다.");
}

export function deleteArticle(id: string | number) {
  return apiDelete<{ success: true }>(`/api/admin/articles/${id}`, undefined, "문서 삭제에 실패했습니다.");
}

export function getBranches() {
  return apiGet<BranchSummary[]>("/api/admin/branches", { cache: "no-store" }, "지점 목록을 불러오지 못했습니다.");
}

export function createBranch(body: CreateBranchRequest) {
  return apiPost<BranchSummary>("/api/admin/branches", body, undefined, "지점 생성에 실패했습니다.");
}

export function updateBranch(id: number, body: UpdateBranchRequest) {
  return apiPatch<BranchSummary>(`/api/admin/branches/${id}`, body, undefined, "지점 수정에 실패했습니다.");
}

export function getBranchChatSessions(branchId: number) {
  return apiGet<ChatSessionListItem[]>(
    `/api/admin/chat-sessions/branches/${branchId}`,
    { cache: "no-store" },
    "대화 세션을 불러오지 못했습니다."
  );
}

export function getBranchChatMessages(branchId: number, sessionId: number) {
  return apiGet<ChatSessionMessageItem[]>(
    `/api/admin/chat-sessions/branches/${branchId}/${sessionId}/messages`,
    { cache: "no-store" },
    "메시지를 불러오지 못했습니다."
  );
}

export function previewChat(question: string) {
  return apiPost<PreviewChatResponse>(
    "/api/admin/preview-chat",
    { question },
    undefined,
    "프리뷰 호출에 실패했습니다."
  );
}
