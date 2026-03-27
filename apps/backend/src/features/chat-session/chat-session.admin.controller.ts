import { Controller, Get, Inject, Param, ParseIntPipe, UseGuards } from "@nestjs/common";
import type { ChatSessionListItem, ChatSessionMessageItem } from "@bon/contracts";
import { AdminSessionGuard } from "../../common/guards/admin-session.guard";
import { ChatSessionService } from "./chat-session.service";

@UseGuards(AdminSessionGuard)
@Controller("admin/chat-sessions")
export class ChatSessionAdminController {
  constructor(@Inject(ChatSessionService) private readonly chatSessionService: ChatSessionService) {}

  @Get("branches/:branchId")
  listByBranch(@Param("branchId", ParseIntPipe) branchId: number): Promise<ChatSessionListItem[]> {
    return this.chatSessionService.listByBranch(branchId);
  }

  @Get("branches/:branchId/:sessionId/messages")
  listMessages(
    @Param("branchId", ParseIntPipe) branchId: number,
    @Param("sessionId", ParseIntPipe) sessionId: number
  ): Promise<ChatSessionMessageItem[]> {
    return this.chatSessionService.listMessages(branchId, sessionId);
  }
}
