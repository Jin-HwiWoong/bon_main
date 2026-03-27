import { Module } from "@nestjs/common";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@bon/db";
import { appConfig } from "../../config";
import { DRIZZLE_DB, PG_POOL } from "./drizzle.constants";

@Module({
  providers: [
    {
      provide: PG_POOL,
      useFactory: () => {
        return new Pool({
          connectionString: appConfig.databaseUrl
        });
      }
    },
    {
      provide: DRIZZLE_DB,
      useFactory: (pool: Pool) => drizzle(pool, { schema }),
      inject: [PG_POOL]
    }
  ],
  exports: [PG_POOL, DRIZZLE_DB]
})
export class DrizzleModule {}
