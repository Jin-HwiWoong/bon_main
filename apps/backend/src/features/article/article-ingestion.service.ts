import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateArticleRequest, UpdateArticleRequest } from "@bon/contracts";
import { CategoryRepository } from "../category/category.repository";
import { KnowledgeBaseVectorRepository } from "../../infrastructure/vector/knowledge-base-vector.repository";
import { EmbeddingsProvider } from "../../llm/embeddings.provider";
import { toPgVector } from "../../utils/pgvector";
import { ArticleRepository } from "./article.repository";
import { ArticleRetrievalService } from "./article-retrieval.service";

@Injectable()
export class ArticleIngestionService {
  constructor(
    @Inject(CategoryRepository) private readonly categoryRepository: CategoryRepository,
    @Inject(ArticleRepository) private readonly articleRepository: ArticleRepository,
    @Inject(EmbeddingsProvider) private readonly embeddingsProvider: EmbeddingsProvider,
    @Inject(ArticleRetrievalService) private readonly articleRetrievalService: ArticleRetrievalService,
    @Inject(KnowledgeBaseVectorRepository)
    private readonly knowledgeBaseVectorRepository: KnowledgeBaseVectorRepository
  ) {}

  async create(input: CreateArticleRequest): Promise<{ id: number }> {
    return this.upsert(null, input);
  }

  async update(id: number, input: UpdateArticleRequest): Promise<{ id: number }> {
    return this.upsert(id, input);
  }

  private async upsert(id: number | null, input: CreateArticleRequest | UpdateArticleRequest): Promise<{ id: number }> {
    let articleInput: CreateArticleRequest;
    if (id !== null) {
      const existing = await this.articleRepository.findById(id);
      if (!existing || existing.deletedAt) {
        throw new NotFoundException("문서를 찾을 수 없습니다.");
      }

      articleInput = {
        category_id: input.category_id ?? existing.categoryId,
        title: input.title ?? existing.title,
        content: input.content ?? existing.content,
        summary: input.summary ?? existing.summary,
        priority: input.priority ?? existing.priority,
        requires_sm: input.requires_sm ?? existing.requiresSm,
        is_published: input.is_published ?? existing.isPublished
      };
    } else {
      articleInput = input as CreateArticleRequest;
    }

    const category = await this.categoryRepository.getById(articleInput.category_id);
    if (!category) {
      throw new BadRequestException("카테고리를 찾을 수 없습니다.");
    }

    const titleEmbedding = toPgVector(await this.embeddingsProvider.embedText(articleInput.title));
    const retrieval = await this.articleRetrievalService.build({
      title: articleInput.title,
      content: articleInput.content,
      categoryCode: category.code
    });

    // 문서 본문과 검색용 임베딩을 하나의 트랜잭션으로 저장해 일관성을 유지한다.
    return this.knowledgeBaseVectorRepository.saveArticleWithRetrieval({
      id,
      input: articleInput,
      titleEmbedding,
      retrievalKind: retrieval.retrievalKind,
      retrievalText: retrieval.retrievalText,
      retrievalEmbedding: retrieval.retrievalEmbedding,
      retrievalModel: retrieval.retrievalModel,
      retrievalVersion: retrieval.retrievalVersion
    });
  }
}
