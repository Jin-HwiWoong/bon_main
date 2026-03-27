export type LegacyAuthMode = "admin" | "user";

export interface VerifyPasswordRequest {
  mode: LegacyAuthMode;
  password: string;
}

export interface VerifyPasswordResponse {
  role: "admin" | "branch";
  adminId?: number;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface BranchLoginRequest {
  codeOrName: string;
  password: string;
}

export interface AuthUserPayload {
  role: "admin" | "branch";
  adminId?: number;
  branchId?: number;
  branchCode?: string;
  branchName?: string;
}

export type LoginResponse = AuthUserPayload;
