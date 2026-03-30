import type { CreateArticleImageUploadUrlRequest } from "@bon/contracts";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength, Matches } from "class-validator";

export class CreateArticleImageUploadUrlDto implements CreateArticleImageUploadUrlRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  file_name!: string;

  @Transform(({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^image\/[a-z0-9.+-]+$/)
  content_type!: string;
}
