import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, UseGuards } from "@nestjs/common";
import type { CategorySummary } from "@bon/contracts";
import { AdminSessionGuard } from "../../common/guards/admin-session.guard";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { CategoryService } from "./category.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/categories")
export class CategoryController {
  constructor(@Inject(CategoryService) private readonly categoryService: CategoryService) {}

  @Get()
  list(): Promise<CategorySummary[]> {
    return this.categoryService.listWithCounts();
  }

  @Post()
  create(@Body() body: CreateCategoryDto): Promise<CategorySummary> {
    return this.categoryService.create(body);
  }

  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: UpdateCategoryDto
  ): Promise<CategorySummary> {
    return this.categoryService.update(id, body);
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number): Promise<{ success: true }> {
    await this.categoryService.softDelete(id);
    return { success: true };
  }
}
