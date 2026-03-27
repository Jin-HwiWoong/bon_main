import type { ChatRequest } from "@bon/contracts";
import { Transform, Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class ChatRequestDto implements ChatRequest {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  question!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  session_id?: number;
}
