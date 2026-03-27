const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
require("dotenv").config({ path: path.join(__dirname, "..", "apps", "backend", ".env") });
require("dotenv").config();

const migrationsDir = path.join(__dirname, "..", "packages", "db", "migrations");
const databaseUrl = process.env.DATABASE_URL;
const embeddingDim = process.env.EMBEDDING_DIM || "1536";

if (!databaseUrl) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_migrations (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function hasMigration(name) {
  const { rows } = await pool.query("SELECT 1 FROM app_migrations WHERE name = $1 LIMIT 1", [name]);
  return rows.length > 0;
}

async function markMigration(name) {
  await pool.query("INSERT INTO app_migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [name]);
}

async function run() {
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migration files found.");
    return;
  }

  await ensureMigrationTable();

  for (const file of files) {
    if (await hasMigration(file)) {
      console.log(`Skipping migration: ${file}`);
      continue;
    }

    const fullPath = path.join(migrationsDir, file);
    let sql = fs.readFileSync(fullPath, "utf8");
    sql = sql.replace(/{{EMBEDDING_DIM}}/g, embeddingDim);

    console.log(`Running migration: ${file}`);
    await pool.query("BEGIN");
    try {
      await pool.query(sql);
      await markMigration(file);
      await pool.query("COMMIT");
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  }
}

run()
  .then(() => {
    console.log("DB migrations completed.");
  })
  .catch((err) => {
    console.error("DB migration failed:", err);
    process.exitCode = 1;
  })
  .finally(() => {
    pool.end();
  });
