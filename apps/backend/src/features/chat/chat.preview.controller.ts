import { Body, Controller, Inject, Post, UseGuards } from "@nestjs/common";
import { AdminSessionGuard } from "../../common/guards/admin-session.guard";
import { ChatRequestDto } from "./dto/chat-request.dto";
import { ChatService } from "./chat.service";

@UseGuards(AdminSessionGuard)
@Controller("admin")
export class ChatPreviewController {
  constructor(@Inject(ChatService) private readonly chatService: ChatService) {}

  @Post("preview-chat")
  async preview(@Body() body: ChatRequestDto) {
    return this.chatService.getAnswer(body.question, { includeChunks: true });
  }
}
