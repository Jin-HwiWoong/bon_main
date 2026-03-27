import { Inject, Injectable } from "@nestjs/common";
import { admins } from "@bon/db";
import { and, eq } from "drizzle-orm";
import { DRIZZLE_DB } from "../../infrastructure/database/drizzle.constants";
import type { DrizzleDb } from "../../infrastructure/database/drizzle.types";

@Injectable()
export class AuthRepository {
  constructor(@Inject(DRIZZLE_DB) private readonly db: DrizzleDb) {}

  async findActiveAdminByUsername(username: string) {
    const [admin] = await this.db
      .select()
      .from(admins)
      .where(and(eq(admins.username, username), eq(admins.isActive, true)))
      .limit(1);

    return admin ?? null;
  }
}
