import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import type { SessionUser } from "@bon/entities";
import { compare } from "bcrypt";
import { BranchRepository } from "../branch/branch.repository";
import { AuthRepository } from "./auth.repository";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthRepository) private readonly authRepository: AuthRepository,
    @Inject(BranchRepository) private readonly branchRepository: BranchRepository
  ) {}

  async loginAdmin(username: string, password: string): Promise<SessionUser> {
    const admin = await this.authRepository.findActiveAdminByUsername(username);

    if (!admin || !(await compare(password, admin.passwordHash))) {
      throw new UnauthorizedException("관리자 계정 또는 비밀번호가 올바르지 않습니다.");
    }

    return {
      role: "admin",
      adminId: admin.id
    };
  }

  async loginBranch(codeOrName: string, password: string): Promise<SessionUser> {
    const branch = await this.branchRepository.findActiveByCodeOrName(codeOrName);

    if (!branch || !(await compare(password, branch.passwordHash))) {
      throw new UnauthorizedException("지점 계정 또는 비밀번호가 올바르지 않습니다.");
    }

    await this.branchRepository.touchLogin(branch.id);

    return {
      role: "branch",
      branchId: branch.id,
      branchCode: branch.code,
      branchName: branch.name
    };
  }
}
