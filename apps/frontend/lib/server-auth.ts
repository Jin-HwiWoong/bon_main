import "server-only";

import { redirect } from "next/navigation";
import type { AuthUserPayload } from "@bon/contracts";
import type { UserRole } from "@/types";
import { fetchBackendWithServerCookies } from "@/lib/server/backend-client";

export function toUserRole(user: AuthUserPayload): UserRole {
  return user.role === "branch" ? "user" : "admin";
}

export async function getServerAuthUser(): Promise<AuthUserPayload | null> {
  try {
    const response = await fetchBackendWithServerCookies("/auth/me");

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as AuthUserPayload | null;
    return data;
  } catch {
    return null;
  }
}

export async function requireServerRole(role: UserRole, redirectTo = "/") {
  const user = await getServerAuthUser();

  if (!user || toUserRole(user) !== role) {
    redirect(redirectTo);
  }

  return user;
}
