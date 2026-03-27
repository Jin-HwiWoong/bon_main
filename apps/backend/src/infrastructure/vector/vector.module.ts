import { Module } from "@nestjs/common";
import { DrizzleModule } from "../database/drizzle.module";
import { KnowledgeBaseVectorRepository } from "./knowledge-base-vector.repository";

@Module({
  imports: [DrizzleModule],
  providers: [KnowledgeBaseVectorRepository],
  exports: [KnowledgeBaseVectorRepository]
})
export class VectorModule {}
