import type * as schema from "@bon/db";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export type DrizzleDb = NodePgDatabase<typeof schema>;
