import { Module } from "@nestjs/common";
import { BranchModule } from "../branch/branch.module";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { AuthController } from "./auth.controller";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";

@Module({
  imports: [DrizzleModule, BranchModule],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository]
})
export class AuthModule {}
