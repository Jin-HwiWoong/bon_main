const path = require("path");
const bcrypt = require("bcrypt");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", "apps", "backend", ".env") });
require("dotenv").config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const username = process.env.ADMIN_USERNAME || "admin";
  const displayName = process.env.ADMIN_DISPLAY_NAME || "관리자";
  const password = process.env.ADMIN_PASSWORD;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  if (!password) {
    throw new Error("ADMIN_PASSWORD is required to seed the admin user.");
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await client.query(
      `
      INSERT INTO admins (username, display_name, password_hash, is_active)
      VALUES ($1, $2, $3, true)
      ON CONFLICT (username)
      DO UPDATE SET
        display_name = EXCLUDED.display_name,
        password_hash = EXCLUDED.password_hash,
        is_active = true,
        updated_at = now()
      `,
      [username, displayName, passwordHash]
    );

    console.log(`Admin upserted: ${username}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("Admin seed failed:", error);
  process.exitCode = 1;
});
