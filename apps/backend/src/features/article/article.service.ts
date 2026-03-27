import { Inject, Injectable } from "@nestjs/common";
import type { ArticleSummary, CreateArticleRequest, UpdateArticleRequest } from "@bon/contracts";
import { ArticleIngestionService } from "./article-ingestion.service";
import { ArticleRepository } from "./article.repository";

@Injectable()
export class ArticleService {
  constructor(
    @Inject(ArticleRepository) private readonly articleRepository: ArticleRepository,
    @Inject(ArticleIngestionService) private readonly articleIngestionService: ArticleIngestionService
  ) {}

  async list(params: {
    category_id?: number;
    is_published?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ data: ArticleSummary[]; total: number }> {
    return this.articleRepository.list(params);
  }

  async get(id: number): Promise<ArticleSummary | null> {
    return this.articleRepository.getById(id);
  }

  async create(input: CreateArticleRequest): Promise<{ id: number }> {
    return this.articleIngestionService.create(input);
  }

  async update(id: number, input: UpdateArticleRequest): Promise<{ id: number }> {
    return this.articleIngestionService.update(id, input);
  }

  async delete(id: number): Promise<void> {
    await this.articleRepository.softDelete(id);
  }
}
