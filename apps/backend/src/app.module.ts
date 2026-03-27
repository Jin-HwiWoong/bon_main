import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ArticleModule } from "./features/article/article.module";
import { AuthModule } from "./features/auth/auth.module";
import { BranchModule } from "./features/branch/branch.module";
import { CategoryModule } from "./features/category/category.module";
import { ChatModule } from "./features/chat/chat.module";
import { ChatSessionModule } from "./features/chat-session/chat-session.module";
import { DrizzleModule } from "./infrastructure/database/drizzle.module";
import { LlmModule } from "./llm/llm.module";

@Module({
  controllers: [AppController],
  imports: [
    DrizzleModule,
    LlmModule,
    AuthModule,
    BranchModule,
    ChatSessionModule,
    CategoryModule,
    ArticleModule,
    ChatModule
  ]
})
export class AppModule {}
