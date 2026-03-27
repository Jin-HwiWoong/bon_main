import { Body, Controller, Delete, Get, Inject, NotFoundException, Param, ParseIntPipe, Post, Put, Query, UseGuards } from "@nestjs/common";
import type { ArticleSummary } from "@bon/contracts";
import { AdminSessionGuard } from "../../common/guards/admin-session.guard";
import { CreateArticleDto } from "./dto/create-article.dto";
import { ListArticlesQueryDto } from "./dto/list-articles-query.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { ArticleService } from "./article.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/articles")
export class ArticleController {
  constructor(@Inject(ArticleService) private readonly articleService: ArticleService) {}

  @Get()
  async list(
    @Query() query: ListArticlesQueryDto
  ): Promise<{ items: ArticleSummary[]; total: number }> {
    const result = await this.articleService.list(query);

    return { items: result.data, total: result.total };
  }

  @Get(":id")
  async get(@Param("id", ParseIntPipe) id: number): Promise<ArticleSummary> {
    const article = await this.articleService.get(id);
    if (!article) {
      throw new NotFoundException("문서를 찾을 수 없습니다.");
    }

    return article;
  }

  @Post()
  create(@Body() body: CreateArticleDto): Promise<{ id: number }> {
    return this.articleService.create(body);
  }

  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateArticleDto
  ): Promise<{ id: number }> {
    return this.articleService.update(id, body);
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number): Promise<{ success: true }> {
    await this.articleService.delete(id);
    return { success: true };
  }
}
