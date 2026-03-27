import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common";
import type {
  ChatSessionListItem,
  ChatSessionMessageItem
} from "@bon/contracts";
import type { SessionUser } from "@bon/entities";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { BranchSessionGuard } from "../../common/guards/branch-session.guard";
import { CreateChatMessageDto } from "./dto/create-chat-message.dto";
import { CreateChatSessionDto } from "./dto/create-chat-session.dto";
import { ChatSessionService } from "./chat-session.service";

@UseGuards(BranchSessionGuard)
@Controller("chat-sessions")
export class ChatSessionController {
  constructor(@Inject(ChatSessionService) private readonly chatSessionService: ChatSessionService) {}

  @Get()
  list(@CurrentUser() user: SessionUser): Promise<ChatSessionListItem[]> {
    return this.chatSessionService.listByBranch(user.branchId!);
  }

  @Post()
  create(
    @CurrentUser() user: SessionUser,
    @Body() body: CreateChatSessionDto
  ): Promise<ChatSessionListItem> {
    return this.chatSessionService.create(user.branchId!, body);
  }

  @Get(":id/messages")
  listMessages(
    @CurrentUser() user: SessionUser,
    @Param("id", ParseIntPipe) id: number
  ): Promise<ChatSessionMessageItem[]> {
    return this.chatSessionService.listMessages(user.branchId!, id);
  }

  @Post(":id/messages")
  createMessage(
    @CurrentUser() user: SessionUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() body: CreateChatMessageDto
  ): Promise<ChatSessionMessageItem> {
    return this.chatSessionService.createMessage(user.branchId!, id, body);
  }
}
