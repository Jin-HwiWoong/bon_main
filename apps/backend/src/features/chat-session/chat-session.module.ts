import { Module } from "@nestjs/common";
import { DrizzleModule } from "../../infrastructure/database/drizzle.module";
import { ChatSessionAdminController } from "./chat-session.admin.controller";
import { ChatSessionController } from "./chat-session.controller";
import { ChatSessionRepository } from "./chat-session.repository";
import { ChatSessionService } from "./chat-session.service";

@Module({
  imports: [DrizzleModule],
  controllers: [ChatSessionController, ChatSessionAdminController],
  providers: [ChatSessionService, ChatSessionRepository],
  exports: [ChatSessionService]
})
export class ChatSessionModule {}
