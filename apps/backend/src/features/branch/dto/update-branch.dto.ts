import type { UpdateBranchRequest } from "@bon/contracts";
import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateBranchDto implements UpdateBranchRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}
