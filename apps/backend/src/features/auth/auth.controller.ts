import { Body, Controller, Get, Inject, Post, Req, Session } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { SessionUser } from "@bon/entities";
import type { RequestWithSession } from "../../common/types/request-with-session";
import { AdminLoginDto } from "./dto/admin-login.dto";
import { BranchLoginDto } from "./dto/branch-login.dto";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("admin/login")
  async loginAdmin(
    @Body() body: AdminLoginDto,
    @Session() session: RequestWithSession["session"]
  ): Promise<SessionUser> {
    const user = await this.authService.loginAdmin(body.username, body.password);
    session.user = user;
    return user;
  }

  @Post("branch/login")
  async loginBranch(
    @Body() body: BranchLoginDto,
    @Session() session: RequestWithSession["session"]
  ): Promise<SessionUser> {
    const user = await this.authService.loginBranch(body.codeOrName, body.password);
    session.user = user;
    return user;
  }

  @Post("logout")
  async logout(@Req() request: RequestWithSession): Promise<{ success: true }> {
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    return { success: true };
  }

  @Get("me")
  getMe(@CurrentUser() user: SessionUser | undefined): SessionUser | null {
    return user ?? null;
  }
}
