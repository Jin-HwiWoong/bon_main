import type { ReactNode } from "react";
import { requireServerRole } from "@/lib/server-auth";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  await requireServerRole("user");

  return children;
}
