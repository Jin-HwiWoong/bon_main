import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { CategoryController } from "./category.controller";
import { CategoryRepository } from "./category.repository";
import { CategoryService } from "./category.service";

@Module({
  imports: [DrizzleModule],
  controllers: [CategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService, CategoryRepository]
})
export class CategoryModule {}
