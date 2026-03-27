import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { BranchSummary, CreateBranchRequest, UpdateBranchRequest } from "@bon/contracts";
import { branches } from "@bon/db";
import { hash } from "bcrypt";
import type { DatabaseError } from "pg";
import { toBranchSummary } from "./branch.mapper";
import { BranchRepository } from "./branch.repository";

@Injectable()
export class BranchService {
  constructor(@Inject(BranchRepository) private readonly branchRepository: BranchRepository) {}

  async list(): Promise<BranchSummary[]> {
    const rows = await this.branchRepository.list();
    return rows.map(toBranchSummary);
  }

  async create(input: CreateBranchRequest): Promise<BranchSummary> {
    const passwordHash = await hash(input.password, 10);
    let row;
    try {
      row = await this.branchRepository.create({
        code: input.code,
        name: input.name,
        passwordHash
      });
    } catch (error) {
      throw mapBranchWriteError(error);
    }

    return toBranchSummary(row);
  }

  async update(id: number, input: UpdateBranchRequest): Promise<BranchSummary> {
    const patch: Partial<typeof branches.$inferInsert> = {
      updatedAt: new Date()
    };

    if (typeof input.name === "string") patch.name = input.name;
    if (typeof input.is_active === "boolean") patch.isActive = input.is_active;
    if (typeof input.password === "string" && input.password.trim()) {
      patch.passwordHash = await hash(input.password, 10);
    }

    let row;
    try {
      row = await this.branchRepository.update(id, patch);
    } catch (error) {
      throw mapBranchWriteError(error);
    }
    if (!row) {
      throw new NotFoundException("지점을 찾을 수 없습니다.");
    }

    return toBranchSummary(row);
  }
}

function mapBranchWriteError(error: unknown) {
  const dbError = error as Partial<DatabaseError> | undefined;
  if (dbError?.code === "23505") {
    if (dbError.constraint === "branches_code_unique") {
      return new ConflictException("이미 사용 중인 지점 코드입니다.");
    }
    if (dbError.constraint === "branches_name_unique") {
      return new ConflictException("이미 사용 중인 지점명입니다.");
    }
  }

  return error;
}
