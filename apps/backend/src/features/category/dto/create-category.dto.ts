import type { CreateCategoryRequest } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateCategoryDto implements CreateCategoryRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

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
}
