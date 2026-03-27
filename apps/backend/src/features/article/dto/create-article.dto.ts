import type { CreateArticleRequest } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateArticleDto implements CreateArticleRequest {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  category_id!: number;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  content!: string;

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
