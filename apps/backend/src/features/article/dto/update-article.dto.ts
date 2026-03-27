import type { UpdateArticleRequest } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateArticleDto implements UpdateArticleRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  category_id?: number;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  @IsOptional()
  title?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  content?: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  summary?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;

  @IsBoolean()
  @IsOptional()
  requires_sm?: boolean;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;
}
