import { Transform, Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

function toOptionalBoolean(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}

export class ListArticlesQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  category_id?: number;

  @Transform(({ value }) => toOptionalBoolean(value))
  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  page_size?: number;
}
