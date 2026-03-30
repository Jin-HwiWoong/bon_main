import type { EntityTimestamp } from "./base";

export interface CategoryEntity {
  id: number;
  code: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  deletedAt: EntityTimestamp | null;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
}

export interface ArticleEntity {
  id: number;
  categoryId: number;
  title: string;
  content: string;
  summary: string | null;
  priority: number;
  requiresSm: boolean;
  isPublished: boolean;
  titleEmbedding: string | null;
  retrievalKind: string | null;
  retrievalText: string | null;
  retrievalEmbedding: string | null;
  retrievalModel: string | null;
  retrievalVersion: string | null;
  retrievalIndexedAt: EntityTimestamp | null;
  retrievalError: string | null;
  deletedAt: EntityTimestamp | null;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
}

export interface ChunkEntity {
  id: number;
  articleId: number;
  content: string;
  chunkIndex: number;
  categoryCode: string;
  embedding: string;
  createdAt: EntityTimestamp;
}
