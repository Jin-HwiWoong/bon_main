import type { CreateChatMessageRequest, UiMessageRole } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min, ValidateNested } from "class-validator";

class ChatReferenceDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  article_id!: number;

  @IsString()
  @MaxLength(50)
  category_code!: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;
}

export class CreateChatMessageDto implements CreateChatMessageRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsIn(["user", "assistant"] as UiMessageRole[])
  role!: UiMessageRole;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatReferenceDto)
  @IsOptional()
  references?: ChatReferenceDto[] | null;

  @IsBoolean()
  @IsOptional()
  fallback_to_sm?: boolean | null;
}
