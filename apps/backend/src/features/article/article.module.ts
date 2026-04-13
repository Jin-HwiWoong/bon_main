import { Module } from "@nestjs/common";
import { CategoryModule } from "../category/category.module";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { StorageModule } from "../../infrastructure/storage/storage.module";
import { VectorModule } from "../../infrastructure/vector/vector.module";
import { LlmModule } from "../../llm/llm.module";
import { ArticleAssetService } from "./article-asset.service";
import { ArticleIngestionService } from "./article-ingestion.service";
import { ArticleController } from "./article.controller";
import { ArticleRetrievalService } from "./article-retrieval.service";
import { ArticleRepository } from "./article.repository";
import { ArticleService } from "./article.service";

@Module({
  imports: [DrizzleModule, LlmModule, CategoryModule, VectorModule, StorageModule],
  controllers: [ArticleController],
  providers: [ArticleService, ArticleAssetService, ArticleIngestionService, ArticleRepository, ArticleRetrievalService],
  exports: [ArticleService]
})
export class ArticleModule {}
