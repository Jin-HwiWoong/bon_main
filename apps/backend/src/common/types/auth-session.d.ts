import "express-session";
import type { SessionUser } from "@bon/entities";

declare module "express-session" {
  interface SessionData {
    user?: SessionUser;
  }
}
