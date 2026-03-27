import type { CreateChatSessionRequest } from "@bon/contracts";
import { Transform } from "class-transformer";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateChatSessionDto implements CreateChatSessionRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(120)
  title?: string;
}
