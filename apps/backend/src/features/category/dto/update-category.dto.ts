import type { UpdateCategoryRequest } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateCategoryDto implements UpdateCategoryRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  sort_order?: number;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
