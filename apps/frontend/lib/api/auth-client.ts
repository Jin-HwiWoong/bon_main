import type { AuthUserPayload } from "@bon/contracts";
import { apiGet, apiPost } from "@/lib/api/http";

export function login(role: "admin" | "user", identifier: string, password: string) {
  return apiPost<AuthUserPayload>(
    "/api/auth/verify",
    { mode: role, identifier, password },
    undefined,
    "인증에 실패했습니다."
  );
}

export function getCurrentUser() {
  return apiGet<AuthUserPayload | null>("/api/auth/me", { cache: "no-store" }, "세션 확인에 실패했습니다.");
}

export function logout() {
  return apiPost<{ success: true }>("/api/auth/logout", undefined, undefined, "로그아웃에 실패했습니다.");
}
