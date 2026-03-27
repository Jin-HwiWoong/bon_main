import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { BranchController } from "./branch.controller";
import { BranchRepository } from "./branch.repository";
import { BranchService } from "./branch.service";

@Module({
  imports: [DrizzleModule],
  controllers: [BranchController],
  providers: [BranchService, BranchRepository],
  exports: [BranchRepository]
})
export class BranchModule {}
