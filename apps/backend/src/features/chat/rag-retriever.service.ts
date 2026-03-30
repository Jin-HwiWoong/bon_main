import { Inject, Injectable } from "@nestjs/common";
import { appConfig } from "../../config";
import { KnowledgeBaseVectorRepository } from "../../infrastructure/vector/knowledge-base-vector.repository";
import { EmbeddingsProvider } from "../../llm/embeddings.provider";
import { toPgVector } from "../../utils/pgvector";
import type { RagDocument } from "./types";

@Injectable()
export class RagRetrieverService {
  constructor(
    @Inject(EmbeddingsProvider) private readonly embeddingsProvider: EmbeddingsProvider,
    @Inject(KnowledgeBaseVectorRepository)
    private readonly knowledgeBaseVectorRepository: KnowledgeBaseVectorRepository
  ) {}

  async retrieve(question: string): Promise<{
    documents: RagDocument[];
    fallbackToSm: boolean;
    requiresSmExists: boolean;
  }> {
    // 질문 임베딩 생성과 검색 결과 후처리는 서비스 계층에서 담당한다.
    const embedding = await this.embeddingsProvider.embedText(question);
    const embeddingParam = toPgVector(embedding);
    const documents = await this.knowledgeBaseVectorRepository.findTopArticlesByEmbedding(embeddingParam, appConfig.ragTopK);
    const filtered = documents.filter(
      (document) => (document.score ?? 0) >= appConfig.ragMinScore || (document.title_score ?? 0) >= appConfig.ragMinScore
    );

    return {
      documents: filtered,
      fallbackToSm: filtered.length === 0,
      requiresSmExists: filtered.some((document) => document.requires_sm)
    };
  }
}
