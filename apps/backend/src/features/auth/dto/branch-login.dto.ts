import type { BranchLoginRequest } from "@bon/contracts";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString } from "class-validator";

export class BranchLoginDto implements BranchLoginRequest {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  codeOrName!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
