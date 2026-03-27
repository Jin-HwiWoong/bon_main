import type { EntityTimestamp, SessionRole } from "./base";

export interface AdminEntity {
  id: number;
  username: string;
  displayName: string;
  passwordHash: string;
  isActive: boolean;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
}

export interface BranchEntity {
  id: number;
  code: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  lastLoginAt: EntityTimestamp | null;
  createdAt: EntityTimestamp;
  updatedAt: EntityTimestamp;
}

export interface SessionUser {
  role: SessionRole;
  adminId?: number;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
}
