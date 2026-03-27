import { Module } from "@nestjs/common";
import { CategoryModule } from "../category/category.module";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { VectorModule } from "../../infrastructure/vector/vector.module";
import { LlmModule } from "../../llm/llm.module";
import { ArticleIngestionService } from "./article-ingestion.service";
import { ArticleController } from "./article.controller";
import { ArticleRepository } from "./article.repository";
import { ArticleService } from "./article.service";

@Module({
  imports: [DrizzleModule, LlmModule, CategoryModule, VectorModule],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleIngestionService, ArticleRepository],
  exports: [ArticleService]
})
export class ArticleModule {}
